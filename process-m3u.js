const fs = require('fs');
const path = require('path');

/**
 * Processa arquivo M3U para eliminar canais repetidos
 * Mantém apenas os 3 canais de maior resolução para cada programa
 */
function processM3UFile(inputFile) {
    console.log(`📁 Processando arquivo: ${inputFile}`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(inputFile)) {
        console.error(`❌ Arquivo não encontrado: ${inputFile}`);
        console.log('📋 Arquivos disponíveis no diretório:');
        const files = fs.readdirSync('.');
        files.forEach(file => {
            if (file.endsWith('.m3u') || file.endsWith('.m3u8')) {
                console.log(`   - ${file}`);
            }
        });
        return;
    }
    
    try {
        // Ler o arquivo
        const content = fs.readFileSync(inputFile, 'utf8');
        const lines = content.split('\n');
        
        console.log(`📊 Total de linhas: ${lines.length}`);
        
        // Parse do arquivo M3U
        const channels = [];
        let currentChannel = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('#EXTINF:')) {
                // Extrair nome do canal
                const match = trimmedLine.match(/#EXTINF:-?\d+\s*(.+)/);
                if (match) {
                    currentChannel = {
                        name: match[1].trim(),
                        line: trimmedLine,
                        url: null
                    };
                }
            } else if (trimmedLine && !trimmedLine.startsWith('#') && currentChannel) {
                // URL do canal
                currentChannel.url = trimmedLine;
                channels.push(currentChannel);
                currentChannel = null;
            }
        }
        
        console.log(`📺 Canais encontrados: ${channels.length}`);
        
        // Extrair nome base e resolução
        channels.forEach(channel => {
            const name = channel.name;
            
            // Extrair resolução
            let resolution = 0;
            let resolutionText = 'Unknown';
            
            // Padrões de resolução
            if (name.match(/4K|UHD/i)) {
                resolution = 4;
                resolutionText = '4K/UHD';
            } else if (name.match(/1080p|FHD/i)) {
                resolution = 3;
                resolutionText = '1080p/FHD';
            } else if (name.match(/720p|HD/i)) {
                resolution = 2;
                resolutionText = '720p/HD';
            } else if (name.match(/480p|SD/i)) {
                resolution = 1;
                resolutionText = '480p/SD';
            }
            
            // Extrair nome base (remover resolução)
            let baseName = name
                .replace(/\s*\d{3,4}p\s*/gi, ' ')
                .replace(/\s*HD\s*/gi, ' ')
                .replace(/\s*FHD\s*/gi, ' ')
                .replace(/\s*UHD\s*/gi, ' ')
                .replace(/\s*4K\s*/gi, ' ')
                .replace(/\s*SD\s*/gi, ' ')
                .replace(/\s*\[.*?\]\s*/g, ' ')
                .replace(/\s*\(.*?\)\s*/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
            
            channel.baseName = baseName;
            channel.resolution = resolution;
            channel.resolutionText = resolutionText;
        });
        
        // Agrupar por nome base
        const groups = {};
        channels.forEach(channel => {
            if (!groups[channel.baseName]) {
                groups[channel.baseName] = [];
            }
            groups[channel.baseName].push(channel);
        });
        
        console.log(`📊 Grupos de canais: ${Object.keys(groups).length}`);
        
        // Processar cada grupo
        const processedChannels = [];
        
        Object.entries(groups).forEach(([baseName, groupChannels]) => {
            // Ordenar por resolução (maior primeiro)
            groupChannels.sort((a, b) => b.resolution - a.resolution);
            
            // Manter apenas os 3 primeiros
            const topChannels = groupChannels.slice(0, 3);
            
            console.log(`📺 ${baseName}: ${groupChannels.length} → ${topChannels.length} canais`);
            
            // Mostrar resoluções dos canais mantidos
            topChannels.forEach((channel, index) => {
                console.log(`   ${index + 1}. ${channel.resolutionText} - ${channel.name}`);
            });
            
            processedChannels.push(...topChannels);
        });
        
        // Gerar arquivo de saída
        const outputFile = inputFile.replace('.m3u', '_processed.m3u');
        let output = '#EXTM3U\n';
        
        processedChannels.forEach(channel => {
            output += channel.line + '\n';
            output += channel.url + '\n';
        });
        
        fs.writeFileSync(outputFile, output, 'utf8');
        
        console.log('\n📊 RESUMO:');
        console.log(`📺 Canais originais: ${channels.length}`);
        console.log(`✅ Canais processados: ${processedChannels.length}`);
        console.log(`🗑️ Canais removidos: ${channels.length - processedChannels.length}`);
        console.log(`📈 Redução: ${((channels.length - processedChannels.length) / channels.length * 100).toFixed(1)}%`);
        console.log(`📁 Arquivo de saída: ${outputFile}`);
        
    } catch (error) {
        console.error(`❌ Erro ao processar arquivo: ${error.message}`);
    }
}

// Executar
const inputFile = 'tv_channels_014618612_plus.m3u';
processM3UFile(inputFile); 