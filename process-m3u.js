const fs = require('fs');
const path = require('path');

/**
 * Processa arquivo M3U para eliminar canais repetidos
 * Mantém apenas canais HD, Full HD, 4K e SD
 * Remove canais com group-titles específicos
 * Whitelist para canais importantes (GLOBO, PREMIERE, etc.)
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
                // Extrair nome do canal e group-title
                const match = trimmedLine.match(/#EXTINF:-?\d+\s*(.+)/);
                const groupTitleMatch = trimmedLine.match(/group-title="([^"]+)"/);
                
                if (match) {
                    currentChannel = {
                        name: match[1].trim(),
                        line: trimmedLine,
                        url: null,
                        groupTitle: groupTitleMatch ? groupTitleMatch[1].trim() : ''
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
        
        // Lista de group-titles para remover
        const excludedGroupTitles = [
            'SERIES',
            'LANÇAMENTOS',
            'FILMES 24H',
            'SERIES 24H',
            'INFANTIL 24H'
        ];
        
        // Lista de group-titles na whitelist (sempre mantidos)
        const whitelistGroupTitles = [
            'GLOBO',
            'PREMIERE',
            'SPORTV',
            'BAND',
            'SBT',
            'RECORD',
            'REDE TV',
            'CNN',
            'FOX',
            'DISNEY',
            'NICKELODEON',
            'CARTOON',
            'DISCOVERY',
            'HISTORY',
            'NAT GEO',
            'HBO',
            'NETFLIX',
            'AMAZON',
            'DISNEY+',
            'STAR+',
            'PARAMOUNT+',
            'APPLE TV+',
            'HBO MAX',
            'PRIME VIDEO'
        ];
        
        // Função para verificar se o group-title deve ser excluído
        function shouldExcludeGroupTitle(groupTitle) {
            const normalizedGroupTitle = groupTitle?.toUpperCase().trim();
            
            if (!normalizedGroupTitle) return false;
            
            // Verificar se está na whitelist (sempre mantido)
            if (whitelistGroupTitles.some(title => normalizedGroupTitle.includes(title.toUpperCase()))) {
                return false;
            }
            
            // Verificar correspondências exatas
            if (excludedGroupTitles.some(title => normalizedGroupTitle === title.toUpperCase())) {
                return true;
            }
            
            // Verificar padrão "LANÇAMENTOS /ano/"
            if (normalizedGroupTitle.match(/^LANÇAMENTOS\s+\/\d{4}\/$/)) {
                return true;
            }
            
            // Verificar padrões de temporada (S01, S02, S03, etc.)
            if (normalizedGroupTitle.match(/S\d{1,2}/)) {
                return true;
            }
            
            return false;
        }
        
        // Função para verificar se o nome do canal deve ser excluído
        function shouldExcludeChannelName(channelName) {
            const normalizedName = channelName?.toUpperCase().trim();
            
            if (!normalizedName) return false;
            
            // Verificar se contém ano entre parênteses (ex: (2013), (2020), etc.)
            if (normalizedName.match(/\(\d{4}\)/)) {
                return true;
            }
            
            // Verificar padrões de temporada no nome (S01, S02, S03, etc.)
            if (normalizedName.match(/S\d{1,2}/)) {
                return true;
            }
            
            return false;
        }
        
        // Função para verificar se a URL deve ser excluída
        function shouldExcludeURL(url) {
            const normalizedURL = url?.toLowerCase().trim();
            
            if (!normalizedURL) return false;
            
            // Verificar se contém "/movie/" na URL
            if (normalizedURL.includes('/movie/')) {
                return true;
            }
            
            return false;
        }
        
        // Filtrar por group-title
        const filteredByGroupTitle = channels.filter(channel => !shouldExcludeGroupTitle(channel.groupTitle));
        console.log(`🗑️ Canais removidos por group-title: ${channels.length - filteredByGroupTitle.length}`);
        
        // Filtrar por nome do canal (anos entre parênteses)
        const filteredByChannelName = filteredByGroupTitle.filter(channel => !shouldExcludeChannelName(channel.name));
        console.log(`🗑️ Canais removidos por nome (anos): ${filteredByGroupTitle.length - filteredByChannelName.length}`);
        
        // Filtrar por URL (/movie/)
        const filteredByURL = filteredByChannelName.filter(channel => !shouldExcludeURL(channel.url));
        console.log(`🗑️ Canais removidos por URL (/movie/): ${filteredByChannelName.length - filteredByURL.length}`);
        
        // Extrair nome base e resolução
        filteredByURL.forEach(channel => {
            const name = channel.name;
            
            // Extrair resolução
            let resolution = 0;
            let resolutionText = 'Unknown';
            let isHighQuality = false;
            
            // Padrões de resolução - HD, Full HD, 4K e SD
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
            } else if (name.match(/480p|SD/i)) {
                resolution = 1;
                resolutionText = '480p/SD';
                isHighQuality = true; // SD também é considerado válido
            } else {
                // Canais sem resolução identificada
                resolution = 0;
                resolutionText = 'Unknown';
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
        
        // Filtrar apenas canais de qualidade válida (HD, Full HD, 4K, SD)
        const validQualityChannels = filteredByURL.filter(channel => channel.isHighQuality);
        console.log(`🎯 Canais de qualidade válida (HD/FHD/4K/SD): ${validQualityChannels.length}`);
        console.log(`🗑️ Canais removidos (Unknown): ${filteredByURL.length - validQualityChannels.length}`);
        
        // Agrupar por nome base
        const groups = {};
        validQualityChannels.forEach(channel => {
            if (!groups[channel.baseName]) {
                groups[channel.baseName] = [];
            }
            groups[channel.baseName].push(channel);
        });
        
        console.log(`📊 Grupos de canais válidos: ${Object.keys(groups).length}`);
        
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
        
        // Ordenar canais por resolução (4K primeiro, depois Full HD, depois HD, depois SD)
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
        const outputFile = inputFile.replace('.m3u', '_filtered_quality.m3u');
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
        console.log(`🗑️ Removidos por group-title: ${channels.length - filteredByGroupTitle.length}`);
        console.log(`🗑️ Removidos por nome (anos): ${filteredByGroupTitle.length - filteredByChannelName.length}`);
        console.log(`🗑️ Removidos por URL (/movie/): ${filteredByChannelName.length - filteredByURL.length}`);
        console.log(`🎯 Canais de qualidade válida: ${validQualityChannels.length}`);
        console.log(`✅ Canais no arquivo final: ${finalChannels.length}`);
        console.log(`🗑️ Total de canais removidos: ${channels.length - finalChannels.length}`);
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
        
        // Mostrar alguns exemplos de group-titles removidos
        const removedGroupTitles = new Set();
        channels.forEach(channel => {
            if (shouldExcludeGroupTitle(channel.groupTitle)) {
                removedGroupTitles.add(channel.groupTitle);
            }
        });
        
        if (removedGroupTitles.size > 0) {
            console.log('\n🗑️ Group-titles removidos:');
            Array.from(removedGroupTitles).slice(0, 10).forEach(title => {
                console.log(`   - "${title}"`);
            });
            if (removedGroupTitles.size > 10) {
                console.log(`   ... e mais ${removedGroupTitles.size - 10} outros`);
            }
        }
        
        // Mostrar alguns exemplos de group-titles da whitelist
        const whitelistFound = new Set();
        finalChannels.forEach(channel => {
            const normalizedTitle = channel.groupTitle?.toUpperCase().trim();
            if (normalizedTitle && whitelistGroupTitles.some(title => normalizedTitle.includes(title.toUpperCase()))) {
                whitelistFound.add(channel.groupTitle);
            }
        });
        
        if (whitelistFound.size > 0) {
            console.log('\n✅ Group-titles da whitelist encontrados:');
            Array.from(whitelistFound).slice(0, 10).forEach(title => {
                console.log(`   - "${title}"`);
            });
            if (whitelistFound.size > 10) {
                console.log(`   ... e mais ${whitelistFound.size - 10} outros`);
            }
        }
        
    } catch (error) {
        console.error(`❌ Erro ao processar arquivo: ${error.message}`);
    }
}

// Executar
const inputFile = 'tv_channels_014618612_plus.m3u';
processM3UFile(inputFile, 20); // Máximo 20MB 