const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Script para testar diferentes variações de URLs IPTV
 */
class IPTVTester {
    constructor() {
        this.userAgent = 'Perfect Player IPTV/2.0.0';
    }

    /**
     * Testa diferentes variações da URL
     */
    async testUrlVariations(baseUrl, username, password) {
        console.log('🧪 Testando diferentes variações da URL IPTV...');
        console.log(`👤 Username: ${username}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🌐 Base URL: ${baseUrl}`);
        
        const variations = [
            // Variação 1: M3U Plus
            {
                name: 'M3U Plus (TS)',
                url: `${baseUrl}?username=${username}&password=${password}&type=m3u_plus&output=ts`
            },
            // Variação 2: M3U Plus sem output
            {
                name: 'M3U Plus (sem output)',
                url: `${baseUrl}?username=${username}&password=${password}&type=m3u_plus`
            },
            // Variação 3: M3U normal
            {
                name: 'M3U Normal',
                url: `${baseUrl}?username=${username}&password=${password}&type=m3u`
            },
            // Variação 4: M3U normal com TS
            {
                name: 'M3U Normal (TS)',
                url: `${baseUrl}?username=${username}&password=${password}&type=m3u&output=ts`
            },
            // Variação 5: Sem tipo especificado
            {
                name: 'Sem tipo',
                url: `${baseUrl}?username=${username}&password=${password}`
            },
            // Variação 6: Com action=get
            {
                name: 'Com action=get',
                url: `${baseUrl}?username=${username}&password=${password}&action=get&type=m3u_plus`
            },
            // Variação 7: Com format=m3u8
            {
                name: 'Format M3U8',
                url: `${baseUrl}?username=${username}&password=${password}&format=m3u8&type=m3u_plus`
            },
            // Variação 8: Com output=m3u8
            {
                name: 'Output M3U8',
                url: `${baseUrl}?username=${username}&password=${password}&type=m3u_plus&output=m3u8`
            }
        ];

        const results = [];

        for (let i = 0; i < variations.length; i++) {
            const variation = variations[i];
            console.log(`\n📡 Testando ${i + 1}/${variations.length}: ${variation.name}`);
            console.log(`🔗 URL: ${variation.url}`);
            
            const result = await this.testUrl(variation.url, variation.name);
            results.push({
                name: variation.name,
                url: variation.url,
                ...result
            });
            
            // Pausa entre testes
            if (i < variations.length - 1) {
                console.log('⏳ Aguardando 2 segundos...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        return results;
    }

    /**
     * Testa uma URL específica
     */
    async testUrl(url, name) {
        try {
            // Tentar GET primeiro
            const getResult = await this.tryGet(url);
            if (getResult.success) {
                return { method: 'GET', ...getResult };
            }

            // Tentar POST se GET falhar
            const postResult = await this.tryPost(url);
            if (postResult.success) {
                return { method: 'POST', ...postResult };
            }

            return { 
                method: 'N/A', 
                success: false, 
                error: `GET: ${getResult.error}, POST: ${postResult.error}` 
            };

        } catch (error) {
            return { 
                method: 'N/A', 
                success: false, 
                error: error.message 
            };
        }
    }

    /**
     * Tenta requisição GET
     */
    async tryGet(url) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive'
                },
                timeout: 15000,
                responseType: 'text'
            });

            if (response.data && response.data.length > 0) {
                return {
                    success: true,
                    status: response.status,
                    contentType: response.headers['content-type'],
                    size: response.data.length,
                    preview: response.data.substring(0, 100) + '...'
                };
            } else {
                return {
                    success: false,
                    error: 'Resposta vazia'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.response ? `HTTP ${error.response.status}` : error.message
            };
        }
    }

    /**
     * Tenta requisição POST
     */
    async tryPost(url) {
        try {
            const urlObj = new URL(url);
            const params = {};
            
            for (const [key, value] of urlObj.searchParams) {
                params[key] = value;
            }

            const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

            const response = await axios.post(baseUrl, params, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'application/x-mpegURL, application/vnd.apple.mpegurl, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Connection': 'keep-alive'
                },
                timeout: 15000,
                responseType: 'text'
            });

            if (response.data && response.data.length > 0) {
                return {
                    success: true,
                    status: response.status,
                    contentType: response.headers['content-type'],
                    size: response.data.length,
                    preview: response.data.substring(0, 100) + '...'
                };
            } else {
                return {
                    success: false,
                    error: 'Resposta vazia'
                };
            }

        } catch (error) {
            return {
                success: false,
                error: error.response ? `HTTP ${error.response.status}` : error.message
            };
        }
    }

    /**
     * Salva o resultado de um teste bem-sucedido
     */
    async saveSuccessfulResult(url, name, method, data) {
        const fileName = `test_${name.replace(/[^a-zA-Z0-9]/g, '_')}.m3u`;
        
        try {
            fs.writeFileSync(fileName, data);
            console.log(`💾 Arquivo salvo: ${fileName}`);
            
            // Analisar conteúdo
            this.analyzeContent(fileName);
            
        } catch (error) {
            console.error('❌ Erro ao salvar arquivo:', error.message);
        }
    }

    /**
     * Analisa o conteúdo do arquivo
     */
    analyzeContent(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            console.log('\n📋 Análise do conteúdo:');
            
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
            }
            
            console.log(`📊 Tamanho: ${(content.length / 1024).toFixed(2)} KB`);
            
        } catch (error) {
            console.error('❌ Erro ao analisar conteúdo:', error.message);
        }
    }

    /**
     * Exibe resumo dos resultados
     */
    displayResults(results) {
        console.log('\n📊 RESUMO DOS TESTES:');
        console.log('='.repeat(60));
        
        let successfulTests = 0;
        
        results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            const method = result.method || 'N/A';
            const size = result.size ? `(${(result.size / 1024).toFixed(1)} KB)` : '';
            
            console.log(`${index + 1}. ${status} ${result.name} [${method}] ${size}`);
            
            if (result.success) {
                successfulTests++;
                console.log(`   📄 Content-Type: ${result.contentType}`);
                console.log(`   👀 Preview: ${result.preview}`);
            } else {
                console.log(`   ❌ Erro: ${result.error}`);
            }
            console.log('');
        });
        
        console.log(`🎯 Resultado: ${successfulTests}/${results.length} testes bem-sucedidos`);
        
        if (successfulTests > 0) {
            console.log('\n🎉 Pelo menos uma variação funcionou!');
        } else {
            console.log('\n💥 Nenhuma variação funcionou. Possíveis causas:');
            console.log('   - Credenciais expiradas ou inválidas');
            console.log('   - Serviço IPTV inativo');
            console.log('   - URL base incorreta');
            console.log('   - Bloqueio por região/IP');
        }
    }
}

// Função principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 IPTV URL Tester');
        console.log('node iptv-tester.js <base_url> <username> <password>');
        console.log('');
        console.log('Exemplo:');
        console.log('node iptv-tester.js "https://u124.live/get.php" "096796562" "577315439"');
        return;
    }
    
    if (args.length < 3) {
        console.log('❌ Erro: Forneça base_url, username e password');
        console.log('Uso: node iptv-tester.js <base_url> <username> <password>');
        return;
    }
    
    const baseUrl = args[0];
    const username = args[1];
    const password = args[2];
    
    const tester = new IPTVTester();
    
    console.log('🚀 Iniciando testes de URL IPTV...');
    
    const results = await tester.testUrlVariations(baseUrl, username, password);
    
    tester.displayResults(results);
    
    // Salvar primeiro resultado bem-sucedido
    const successfulResult = results.find(r => r.success);
    if (successfulResult) {
        console.log('\n💾 Salvando primeiro resultado bem-sucedido...');
        
        // Fazer download completo
        const downloadResult = successfulResult.method === 'POST' 
            ? await tester.tryPost(successfulResult.url)
            : await tester.tryGet(successfulResult.url);
            
        if (downloadResult.success) {
            await tester.saveSuccessfulResult(
                successfulResult.url, 
                successfulResult.name, 
                successfulResult.method, 
                downloadResult.data || ''
            );
        }
    }
}

// Executar se for o arquivo principal
if (require.main === module) {
    main().catch(console.error);
}

module.exports = IPTVTester; 