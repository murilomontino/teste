const fs = require('fs');
const path = require('path');

/**
 * Processa arquivo M3U para eliminar canais repetidos
 * Mantém apenas canais HD, Full HD e 4K
 * Controla tamanho do arquivo final (máximo 20MB)
 */
function processM3UFile(inputFile, maxSizeMB = 20) {
    console.log(`📁 Processando arquivo: ${inputFile}`);
    console.log(`📏 Tamanho máximo do arquivo final: ${maxSizeMB}MB`);
    
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
            let isHighQuality = false;
            
            // Padrões de resolução - APENAS HD, Full HD e 4K
            if (name.match(/4K|UHD/i)) {
                resolution = 4;
                resolutionText = '4K/UHD';
                isHighQuality = true;
            } else if (name.match(/1080p|FHD/i)) {
                resolution = 3;
                resolutionText = '1080p/FHD';
                isHighQuality = true;
            } else if (name.match(/720p|HD/i)) {
                resolution = 2;
                resolutionText = '720p/HD';
                isHighQuality = true;
            } else {
                // Canais SD ou sem resolução identificada
                resolution = 0;
                resolutionText = 'SD/Unknown';
                isHighQuality = false;
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
            channel.isHighQuality = isHighQuality;
        });
        
        // Filtrar apenas canais de alta qualidade (HD, Full HD, 4K)
        const highQualityChannels = channels.filter(channel => channel.isHighQuality);
        console.log(`🎯 Canais de alta qualidade (HD/FHD/4K): ${highQualityChannels.length}`);
        console.log(`🗑️ Canais removidos (SD/Unknown): ${channels.length - highQualityChannels.length}`);
        
        // Agrupar por nome base
        const groups = {};
        highQualityChannels.forEach(channel => {
            if (!groups[channel.baseName]) {
                groups[channel.baseName] = [];
            }
            groups[channel.baseName].push(channel);
        });
        
        console.log(`📊 Grupos de canais de alta qualidade: ${Object.keys(groups).length}`);
        
        // Processar cada grupo - manter apenas o melhor canal de cada grupo
        const processedChannels = [];
        
        Object.entries(groups).forEach(([baseName, groupChannels]) => {
            // Ordenar por resolução (maior primeiro)
            groupChannels.sort((a, b) => b.resolution - a.resolution);
            
            // Manter apenas o melhor canal (maior resolução)
            const bestChannel = groupChannels[0];
            
            console.log(`📺 ${baseName}: ${groupChannels.length} → 1 canal (${bestChannel.resolutionText})`);
            
            processedChannels.push(bestChannel);
        });
        
        // Ordenar canais por resolução (4K primeiro, depois Full HD, depois HD)
        processedChannels.sort((a, b) => b.resolution - a.resolution);
        
        // Controle de tamanho do arquivo
        const maxSizeBytes = maxSizeMB * 1024 * 1024; // Converter MB para bytes
        let finalChannels = [];
        let currentSize = 0;
        const headerSize = '#EXTM3U\n'.length;
        currentSize += headerSize;
        
        console.log(`\n📏 Controlando tamanho do arquivo (máximo: ${maxSizeMB}MB)...`);
        
        for (const channel of processedChannels) {
            const channelSize = (channel.line + '\n' + channel.url + '\n').length;
            
            if (currentSize + channelSize <= maxSizeBytes) {
                finalChannels.push(channel);
                currentSize += channelSize;
            } else {
                console.log(`⚠️ Parando adição de canais - limite de tamanho atingido`);
                break;
            }
        }
        
        // Gerar arquivo de saída
        const outputFile = inputFile.replace('.m3u', '_hd_only.m3u');
        let output = '#EXTM3U\n';
        
        finalChannels.forEach(channel => {
            output += channel.line + '\n';
            output += channel.url + '\n';
        });
        
        fs.writeFileSync(outputFile, output, 'utf8');
        
        // Calcular estatísticas finais
        const finalSizeMB = (currentSize / (1024 * 1024)).toFixed(2);
        
        console.log('\n📊 RESUMO FINAL:');
        console.log(`📺 Canais originais: ${channels.length}`);
        console.log(`🎯 Canais de alta qualidade: ${highQualityChannels.length}`);
        console.log(`✅ Canais no arquivo final: ${finalChannels.length}`);
        console.log(`🗑️ Canais removidos: ${channels.length - finalChannels.length}`);
        console.log(`📈 Redução: ${((channels.length - finalChannels.length) / channels.length * 100).toFixed(1)}%`);
        console.log(`📏 Tamanho do arquivo final: ${finalSizeMB}MB`);
        console.log(`📁 Arquivo de saída: ${outputFile}`);
        
        // Estatísticas por resolução
        const resolutionStats = {};
        finalChannels.forEach(channel => {
            if (!resolutionStats[channel.resolutionText]) {
                resolutionStats[channel.resolutionText] = 0;
            }
            resolutionStats[channel.resolutionText]++;
        });
        
        console.log('\n📺 Distribuição por resolução:');
        Object.entries(resolutionStats).forEach(([resolution, count]) => {
            console.log(`   ${resolution}: ${count} canais`);
        });
        
    } catch (error) {
        console.error(`❌ Erro ao processar arquivo: ${error.message}`);
    }
}

// Executar
const inputFile = 'tv_channels_014618612_plus.m3u';
processM3UFile(inputFile, 20); // Máximo 20MB 