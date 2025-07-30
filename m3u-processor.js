const fs = require('fs');
const path = require('path');

/**
 * Processador de arquivos M3U para eliminar canais repetidos
 * Mantém apenas os 3 canais de maior resolução para cada programa
 */
class M3UProcessor {
    constructor() {
        this.channels = [];
        this.processedChannels = [];
    }

    /**
     * Extrai informações de resolução do nome do canal
     */
    extractResolution(channelName) {
        const resolutionPatterns = [
            { pattern: /(\d{3,4})p/i, priority: 1 }, // 720p, 1080p
            { pattern: /(\d{3,4})x(\d{3,4})/i, priority: 2 }, // 1920x1080
            { pattern: /HD/i, priority: 3 }, // HD
            { pattern: /FHD/i, priority: 4 }, // FHD
            { pattern: /UHD|4K/i, priority: 5 }, // UHD/4K
            { pattern: /SD/i, priority: 0 } // SD
        ];

        for (const { pattern, priority } of resolutionPatterns) {
            const match = channelName.match(pattern);
            if (match) {
                if (pattern.source.includes('x')) {
                    // Para resoluções como 1920x1080, calcular pixels
                    const width = parseInt(match[1]);
                    const height = parseInt(match[2]);
                    return { pixels: width * height, priority, original: match[0] };
                } else if (pattern.source.includes('p')) {
                    // Para resoluções como 720p, 1080p
                    const height = parseInt(match[1]);
                    const width = height * 16 / 9; // Assumindo aspect ratio 16:9
                    return { pixels: width * height, priority, original: match[0] };
                } else {
                    // Para HD, FHD, UHD, etc.
                    const resolutionMap = {
                        'HD': 720 * 1280,
                        'FHD': 1080 * 1920,
                        'UHD': 2160 * 3840,
                        '4K': 2160 * 3840,
                        'SD': 480 * 640
                    };
                    const key = match[0].toUpperCase();
                    return { pixels: resolutionMap[key] || 0, priority, original: match[0] };
                }
            }
        }

        return { pixels: 0, priority: -1, original: 'Unknown' };
    }

    /**
     * Extrai o nome base do canal (sem informações de resolução)
     */
    extractBaseName(channelName) {
        // Remove padrões de resolução
        let baseName = channelName
            .replace(/\s*\d{3,4}p\s*/gi, ' ')
            .replace(/\s*\d{3,4}x\d{3,4}\s*/gi, ' ')
            .replace(/\s*HD\s*/gi, ' ')
            .replace(/\s*FHD\s*/gi, ' ')
            .replace(/\s*UHD\s*/gi, ' ')
            .replace(/\s*4K\s*/gi, ' ')
            .replace(/\s*SD\s*/gi, ' ')
            .replace(/\s*\[.*?\]\s*/g, ' ') // Remove tags entre colchetes
            .replace(/\s*\(.*?\)\s*/g, ' ') // Remove tags entre parênteses
            .replace(/\s+/g, ' ') // Remove espaços múltiplos
            .trim();

        return baseName.toLowerCase();
    }

    /**
     * Carrega e processa o arquivo M3U
     */
    async processFile(inputFile, outputFile = null) {
        try {
            console.log(`📁 Carregando arquivo: ${inputFile}`);
            
            if (!fs.existsSync(inputFile)) {
                throw new Error(`Arquivo não encontrado: ${inputFile}`);
            }

            const content = fs.readFileSync(inputFile, 'utf8');
            const lines = content.split('\n');
            
            console.log(`📊 Total de linhas: ${lines.length}`);
            
            // Parse do arquivo M3U
            this.parseM3U(lines);
            
            // Processar canais
            this.processChannels();
            
            // Gerar arquivo de saída
            const outputPath = outputFile || this.generateOutputPath(inputFile);
            this.generateOutputFile(outputPath);
            
            console.log(`✅ Processamento concluído!`);
            console.log(`📁 Arquivo de saída: ${outputPath}`);
            
            return {
                inputChannels: this.channels.length,
                outputChannels: this.processedChannels.length,
                removedChannels: this.channels.length - this.processedChannels.length,
                outputFile: outputPath
            };

        } catch (error) {
            console.error(`❌ Erro ao processar arquivo: ${error.message}`);
            throw error;
        }
    }

    /**
     * Faz o parse do arquivo M3U
     */
    parseM3U(lines) {
        console.log('🔍 Fazendo parse do arquivo M3U...');
        
        let currentChannel = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('#EXTINF:')) {
                // Linha de informação do canal
                const channelInfo = this.parseExtInf(trimmedLine);
                currentChannel = {
                    info: channelInfo,
                    url: null
                };
            } else if (trimmedLine && !trimmedLine.startsWith('#') && currentChannel) {
                // Linha da URL do canal
                currentChannel.url = trimmedLine;
                this.channels.push(currentChannel);
                currentChannel = null;
            }
        }
        
        console.log(`📺 Canais encontrados: ${this.channels.length}`);
    }

    /**
     * Faz o parse da linha #EXTINF
     */
    parseExtInf(line) {
        // Extrair informações da linha #EXTINF
        const match = line.match(/#EXTINF:-?\d+\s*(.+)/);
        if (match) {
            const channelName = match[1].trim();
            const resolution = this.extractResolution(channelName);
            const baseName = this.extractBaseName(channelName);
            
            return {
                originalName: channelName,
                baseName: baseName,
                resolution: resolution,
                originalLine: line
            };
        }
        
        return {
            originalName: line,
            baseName: line.toLowerCase(),
            resolution: { pixels: 0, priority: -1, original: 'Unknown' },
            originalLine: line
        };
    }

    /**
     * Processa os canais para eliminar repetidos
     */
    processChannels() {
        console.log('🔄 Processando canais para eliminar repetidos...');
        
        // Agrupar canais por nome base
        const channelGroups = {};
        
        for (const channel of this.channels) {
            const baseName = channel.info.baseName;
            
            if (!channelGroups[baseName]) {
                channelGroups[baseName] = [];
            }
            
            channelGroups[baseName].push(channel);
        }
        
        console.log(`📊 Grupos de canais encontrados: ${Object.keys(channelGroups).length}`);
        
        // Para cada grupo, manter apenas os 3 de maior resolução
        for (const [baseName, channels] of Object.entries(channelGroups)) {
            // Ordenar por resolução (maior primeiro)
            channels.sort((a, b) => {
                const resA = a.info.resolution;
                const resB = b.info.resolution;
                
                // Primeiro por prioridade, depois por pixels
                if (resA.priority !== resB.priority) {
                    return resB.priority - resA.priority;
                }
                
                return resB.pixels - resA.pixels;
            });
            
            // Manter apenas os 3 primeiros (maior resolução)
            const topChannels = channels.slice(0, 3);
            
            console.log(`📺 ${baseName}: ${channels.length} canais → ${topChannels.length} mantidos`);
            
            // Mostrar resoluções dos canais mantidos
            topChannels.forEach((channel, index) => {
                const res = channel.info.resolution;
                console.log(`   ${index + 1}. ${res.original} (${res.pixels} pixels)`);
            });
            
            this.processedChannels.push(...topChannels);
        }
        
        console.log(`✅ Total de canais processados: ${this.processedChannels.length}`);
    }

    /**
     * Gera o arquivo de saída
     */
    generateOutputFile(outputPath) {
        console.log('💾 Gerando arquivo de saída...');
        
        let output = '#EXTM3U\n';
        
        for (const channel of this.processedChannels) {
            output += channel.info.originalLine + '\n';
            output += channel.url + '\n';
        }
        
        fs.writeFileSync(outputPath, output, 'utf8');
        console.log(`📁 Arquivo salvo: ${outputPath}`);
    }

    /**
     * Gera nome do arquivo de saída
     */
    generateOutputPath(inputFile) {
        const dir = path.dirname(inputFile);
        const name = path.basename(inputFile, path.extname(inputFile));
        return path.join(dir, `${name}_processed.m3u`);
    }

    /**
     * Exibe estatísticas do processamento
     */
    displayStats() {
        console.log('\n📊 ESTATÍSTICAS DO PROCESSAMENTO:');
        console.log('='.repeat(50));
        console.log(`📺 Canais originais: ${this.channels.length}`);
        console.log(`✅ Canais processados: ${this.processedChannels.length}`);
        console.log(`🗑️ Canais removidos: ${this.channels.length - this.processedChannels.length}`);
        console.log(`📈 Redução: ${((this.channels.length - this.processedChannels.length) / this.channels.length * 100).toFixed(1)}%`);
        
        // Estatísticas por resolução
        const resolutionStats = {};
        this.processedChannels.forEach(channel => {
            const res = channel.info.resolution.original;
            resolutionStats[res] = (resolutionStats[res] || 0) + 1;
        });
        
        console.log('\n📺 Distribuição por resolução:');
        Object.entries(resolutionStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([res, count]) => {
                console.log(`   ${res}: ${count} canais`);
            });
    }
}

// Função principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 M3U Processor - Elimina canais repetidos');
        console.log('node m3u-processor.js <arquivo_entrada.m3u> [arquivo_saida.m3u]');
        console.log('');
        console.log('Exemplo:');
        console.log('node m3u-processor.js tv_channels_014618612_plus.m3u');
        console.log('node m3u-processor.js tv_channels_014618612_plus.m3u canais_processados.m3u');
        return;
    }
    
    const inputFile = args[0];
    const outputFile = args[1] || null;
    
    const processor = new M3UProcessor();
    
    console.log('🚀 Iniciando processamento de arquivo M3U...');
    console.log(`📁 Arquivo de entrada: ${inputFile}`);
    
    try {
        const result = await processor.processFile(inputFile, outputFile);
        
        processor.displayStats();
        
        console.log('\n🎉 Processamento concluído com sucesso!');
        console.log(`📁 Arquivo de saída: ${result.outputFile}`);
        
    } catch (error) {
        console.error('\n❌ Erro durante o processamento:', error.message);
        process.exit(1);
    }
}

// Executar se for o arquivo principal
if (require.main === module) {
    main().catch(console.error);
}

module.exports = M3UProcessor; 