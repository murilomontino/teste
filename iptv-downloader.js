const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Script específico para download de streams IPTV
 * Simula comportamento de aplicativos IPTV reais usando POST
 */
class IPTVDownloader {
    constructor() {
        // User-Agents de aplicativos IPTV reais
        this.userAgents = [
            // Perfect Player IPTV
            'Perfect Player IPTV',
            'Perfect Player IPTV/1.4.9.1',
            'Perfect Player IPTV/2.0.0',
            
            // VLC Media Player
            'VLC/3.0.18 LibVLC/3.0.18',
            'VLC/3.0.20 LibVLC/3.0.20',
            'VLC/3.0.16 LibVLC/3.0.16',
            
            // Kodi
            'Kodi/20.2 (Linux; Android 11; SDK 30)',
            'Kodi/20.1 (Linux; Android 10; SDK 29)',
            'Kodi/19.5 (Linux; Android 9; SDK 28)',
            
            // IPTV Smarters
            'IPTV Smarters/3.0.0',
            'IPTV Smarters Pro/4.0.0',
            
            // TiviMate
            'TiviMate/4.0.0',
            'TiviMate/3.0.0',
            
            // GSE Smart IPTV
            'GSE SMART IPTV/2.0.0',
            'GSE SMART IPTV/1.0.0',
            
            // IPTV Extreme
            'IPTV Extreme/1.0.0',
            
            // Smart IPTV
            'Smart IPTV/1.0.0',
            
            // OTT Navigator
            'OTT Navigator/1.0.0',
            
            // Xtream Codes
            'Xtream Codes/1.0.0',
            
            // M3U Player
            'M3U Player/1.0.0'
        ];
    }

    /**
     * Extrai parâmetros da URL para usar no POST
     */
    extractParams(url) {
        try {
            const urlObj = new URL(url);
            const params = {};
            
            for (const [key, value] of urlObj.searchParams) {
                params[key] = value;
            }
            
            return {
                baseUrl: `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`,
                params: params
            };
        } catch (error) {
            console.log('⚠️ Erro ao extrair parâmetros da URL, usando URL completa');
            return {
                baseUrl: url,
                params: {}
            };
        }
    }

    /**
     * Tenta baixar com diferentes configurações de aplicativos IPTV usando POST
     */
    async downloadWithRetry(url, outputPath = 'stream.m3u', maxRetries = 5) {
        console.log(`🎯 Tentando baixar stream IPTV: ${url}`);
        console.log(`🎭 Simulando comportamento de aplicativos IPTV reais (POST)`);
        
        const { baseUrl, params } = this.extractParams(url);
        console.log(`🔗 URL base: ${baseUrl}`);
        console.log(`📝 Parâmetros: ${JSON.stringify(params)}`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            console.log(`\n📡 Tentativa ${attempt}/${maxRetries}`);
            
            const result = await this.tryDownload(baseUrl, params, outputPath, attempt);
            
            if (result.success) {
                console.log(`✅ Download bem-sucedido na tentativa ${attempt}!`);
                return result;
            }
            
            console.log(`❌ Tentativa ${attempt} falhou: ${result.error}`);
            
            if (attempt < maxRetries) {
                console.log('⏳ Aguardando 3 segundos antes da próxima tentativa...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
        
        console.log('💥 Todas as tentativas falharam');
        return { success: false, error: 'Todas as tentativas falharam' };
    }

    /**
     * Tenta uma configuração específica de aplicativo IPTV usando POST
     */
    async tryDownload(baseUrl, params, outputPath, attempt) {
        const userAgent = this.userAgents[attempt % this.userAgents.length];
        
        // Configurações específicas de aplicativos IPTV com POST
        const configs = [
            // Configuração 1: Perfect Player IPTV
            {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'X-Requested-With': 'com.nstv.perfectplayer',
                    'X-Device-Type': 'android'
                },
                timeout: 30000,
                responseType: 'text'
            },
            // Configuração 2: VLC Media Player
            {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, video/mp2t, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Connection': 'keep-alive',
                    'X-Player': 'VLC'
                },
                timeout: 45000,
                responseType: 'text'
            },
            // Configuração 3: Kodi
            {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, video/mp2t, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Connection': 'keep-alive',
                    'X-Platform': 'android',
                    'X-Device': 'kodi'
                },
                timeout: 60000,
                responseType: 'text'
            },
            // Configuração 4: IPTV Smarters
            {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Connection': 'keep-alive',
                    'X-App-Version': '3.0.0',
                    'X-Platform': 'android',
                    'X-Device-Type': 'mobile'
                },
                timeout: 40000,
                responseType: 'text'
            },
            // Configuração 5: TiviMate
            {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, video/mp2t, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Connection': 'keep-alive',
                    'X-App-Name': 'TiviMate',
                    'X-App-Version': '4.0.0',
                    'X-Platform': 'android'
                },
                timeout: 50000,
                responseType: 'text'
            }
        ];

        const config = configs[attempt % configs.length];
        
        try {
            console.log(`🔧 Simulando: ${this.getAppName(userAgent)}`);
            console.log(`🤖 User-Agent: ${userAgent}`);
            console.log(`📤 Método: POST`);
            
            // Adicionar headers específicos baseados no User-Agent
            if (userAgent.includes('Perfect Player')) {
                config.headers['X-Requested-With'] = 'com.nstv.perfectplayer';
                config.headers['X-Device-Type'] = 'android';
            } else if (userAgent.includes('VLC')) {
                config.headers['X-Player'] = 'VLC';
            } else if (userAgent.includes('Kodi')) {
                config.headers['X-Platform'] = 'android';
                config.headers['X-Device'] = 'kodi';
            } else if (userAgent.includes('Smarters')) {
                config.headers['X-App-Version'] = '3.0.0';
                config.headers['X-Platform'] = 'android';
            } else if (userAgent.includes('TiviMate')) {
                config.headers['X-App-Name'] = 'TiviMate';
                config.headers['X-App-Version'] = '4.0.0';
            }
            
            // Fazer requisição POST
            const response = await axios.post(baseUrl, params, config);
            
            // Verificar se o conteúdo é válido
            if (response.data && response.data.length > 0) {
                // Salvar o arquivo
                fs.writeFileSync(outputPath, response.data);
                
                console.log(`💾 Arquivo salvo: ${outputPath}`);
                console.log(`📊 Tamanho: ${(response.data.length / 1024).toFixed(2)} KB`);
                console.log(`📄 Content-Type: ${response.headers['content-type']}`);
                
                // Verificar se é um arquivo M3U válido
                if (response.data.includes('#EXTM3U') || response.data.includes('http')) {
                    console.log(`✅ Conteúdo parece ser um stream válido!`);
                }
                
                return {
                    success: true,
                    fileName: outputPath,
                    size: response.data.length,
                    contentType: response.headers['content-type'],
                    data: response.data.substring(0, 200) + '...' // Primeiros 200 caracteres
                };
            } else {
                return {
                    success: false,
                    error: 'Resposta vazia do servidor'
                };
            }
            
        } catch (error) {
            let errorMessage = error.message;
            
            if (error.response) {
                errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
                
                // Se for 403, pode ser bloqueio
                if (error.response.status === 403) {
                    errorMessage += ' (Servidor bloqueando - tentando próximo aplicativo)';
                }
                
                // Se for 404, credenciais podem ter expirado
                if (error.response.status === 404) {
                    errorMessage += ' (URL inválida ou credenciais expiradas)';
                }
                
                // Se for 401, credenciais inválidas
                if (error.response.status === 401) {
                    errorMessage += ' (Credenciais inválidas)';
                }
                
                // Se for 405, método não permitido (tentar GET)
                if (error.response.status === 405) {
                    errorMessage += ' (Método POST não permitido - tentando GET)';
                }
            }
            
            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Tenta também com GET como fallback
     */
    async tryGetAsFallback(url, outputPath, attempt) {
        const userAgent = this.userAgents[attempt % this.userAgents.length];
        
        try {
            console.log(`🔄 Tentando GET como fallback...`);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                },
                timeout: 30000,
                responseType: 'text'
            });
            
            if (response.data && response.data.length > 0) {
                fs.writeFileSync(outputPath, response.data);
                console.log(`✅ Download via GET bem-sucedido!`);
                
                return {
                    success: true,
                    fileName: outputPath,
                    size: response.data.length,
                    contentType: response.headers['content-type']
                };
            }
            
        } catch (error) {
            console.log(`❌ GET também falhou: ${error.message}`);
        }
        
        return { success: false, error: 'GET também falhou' };
    }

    /**
     * Obtém o nome do aplicativo baseado no User-Agent
     */
    getAppName(userAgent) {
        if (userAgent.includes('Perfect Player')) return 'Perfect Player IPTV';
        if (userAgent.includes('VLC')) return 'VLC Media Player';
        if (userAgent.includes('Kodi')) return 'Kodi';
        if (userAgent.includes('Smarters')) return 'IPTV Smarters';
        if (userAgent.includes('TiviMate')) return 'TiviMate';
        if (userAgent.includes('GSE')) return 'GSE Smart IPTV';
        if (userAgent.includes('Extreme')) return 'IPTV Extreme';
        if (userAgent.includes('Smart IPTV')) return 'Smart IPTV';
        if (userAgent.includes('OTT')) return 'OTT Navigator';
        if (userAgent.includes('Xtream')) return 'Xtream Codes';
        if (userAgent.includes('M3U')) return 'M3U Player';
        return 'Aplicativo IPTV';
    }

    /**
     * Analisa o conteúdo baixado
     */
    analyzeContent(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            console.log('\n📋 Análise do conteúdo:');
            console.log(`📄 Primeiras linhas:`);
            console.log(content.split('\n').slice(0, 10).join('\n'));
            
            // Contar linhas
            const lines = content.split('\n').filter(line => line.trim());
            console.log(`📊 Total de linhas: ${lines.length}`);
            
            // Verificar se é M3U
            if (content.includes('#EXTM3U')) {
                console.log('✅ Formato M3U detectado');
                
                // Contar streams
                const streamCount = (content.match(/#EXTINF:/g) || []).length;
                console.log(`📺 Número de streams: ${streamCount}`);
            }
            
            // Verificar URLs
            const urlMatches = content.match(/https?:\/\/[^\s\n]+/g);
            if (urlMatches) {
                console.log(`🔗 URLs encontradas: ${urlMatches.length}`);
                console.log('🌐 Primeiras URLs:');
                urlMatches.slice(0, 3).forEach((url, i) => {
                    console.log(`  ${i + 1}. ${url}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Erro ao analisar conteúdo:', error.message);
        }
    }
}

// Função principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 IPTV Downloader - Simulador de Aplicativos IPTV (POST)');
        console.log('node iptv-downloader.js <URL> [nome_arquivo]');
        console.log('');
        console.log('Exemplo:');
        console.log('node iptv-downloader.js "https://u124.live/get.php?username=xxx&password=xxx&type=m3u_plus&output=ts" stream.m3u');
        console.log('');
        console.log('🎭 Aplicativos IPTV simulados:');
        console.log('   - Perfect Player IPTV');
        console.log('   - VLC Media Player');
        console.log('   - Kodi');
        console.log('   - IPTV Smarters');
        console.log('   - TiviMate');
        console.log('   - GSE Smart IPTV');
        console.log('   - E outros...');
        console.log('');
        console.log('📤 Usando método POST para simular comportamento real');
        return;
    }
    
    const url = args[0];
    const outputPath = args[1] || 'stream_iptv.m3u';
    
    const downloader = new IPTVDownloader();
    
    console.log('🚀 Iniciando download de stream IPTV...');
    console.log(`🎯 URL: ${url}`);
    console.log(`💾 Arquivo de saída: ${outputPath}`);
    console.log('🎭 Simulando comportamento de aplicativos IPTV reais (POST)...');
    
    const result = await downloader.downloadWithRetry(url, outputPath);
    
    if (result.success) {
        console.log('\n🎉 Download concluído com sucesso!');
        downloader.analyzeContent(outputPath);
    } else {
        console.log('\n💥 Falha no download');
        console.log('💡 Possíveis soluções:');
        console.log('   - Verificar se as credenciais ainda são válidas');
        console.log('   - Tentar acessar a URL em um player IPTV real');
        console.log('   - Verificar se o serviço IPTV está ativo');
        console.log('   - Tentar com diferentes aplicativos IPTV');
        console.log('   - Verificar se o servidor aceita o tipo de output solicitado');
        console.log('   - O servidor pode requerer método GET em vez de POST');
    }
}

// Executar se for o arquivo principal
if (require.main === module) {
    main().catch(console.error);
}

module.exports = IPTVDownloader; 