const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Função para baixar conteúdo de um link
 * @param {string} url - URL do conteúdo a ser baixado
 * @param {string} outputPath - Caminho onde salvar o arquivo (opcional)
 * @param {Object} options - Opções adicionais
 */
async function downloadFromLink(url, outputPath = null, options = {}) {
    try {
        console.log(`🔄 Iniciando download de: ${url}`);
        
        // Configurações padrão
        const config = {
            timeout: options.timeout || 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                ...options.headers
            },
            responseType: options.responseType || 'arraybuffer'
        };

        // Fazendo a requisição
        const response = await axios.get(url, config);
        
        // Determinando o nome do arquivo se não fornecido
        let fileName = outputPath;
        if (!fileName) {
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match) {
                    fileName = match[1];
                }
            }
            
            if (!fileName) {
                // Extrair nome do arquivo da URL
                const urlPath = new URL(url).pathname;
                fileName = path.basename(urlPath) || 'downloaded_file';
                
                // Adicionar extensão baseada no content-type se necessário
                const contentType = response.headers['content-type'];
                if (contentType && !path.extname(fileName)) {
                    const ext = getExtensionFromContentType(contentType);
                    if (ext) {
                        fileName += ext;
                    }
                }
            }
        }

        // Criando diretório se não existir
        const dir = path.dirname(fileName);
        if (dir && !fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Salvando o arquivo
        fs.writeFileSync(fileName, response.data);
        
        console.log(`✅ Download concluído! Arquivo salvo como: ${fileName}`);
        console.log(`📊 Tamanho: ${(response.data.length / 1024).toFixed(2)} KB`);
        
        return {
            success: true,
            fileName: fileName,
            size: response.data.length,
            contentType: response.headers['content-type']
        };

    } catch (error) {
        console.error(`❌ Erro no download: ${error.message}`);
        
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Headers:`, error.response.headers);
        }
        
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Função para baixar texto/HTML de uma página web
 * @param {string} url - URL da página
 * @param {string} outputPath - Caminho do arquivo de saída
 */
async function downloadWebPage(url, outputPath = 'page.html') {
    const options = {
        responseType: 'text',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    };
    
    return await downloadFromLink(url, outputPath, options);
}

/**
 * Função para baixar uma imagem
 * @param {string} url - URL da imagem
 * @param {string} outputPath - Caminho do arquivo de saída
 */
async function downloadImage(url, outputPath = null) {
    const options = {
        responseType: 'arraybuffer',
        headers: {
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        }
    };
    
    return await downloadFromLink(url, outputPath, options);
}

/**
 * Função para baixar um arquivo JSON
 * @param {string} url - URL do arquivo JSON
 * @param {string} outputPath - Caminho do arquivo de saída
 */
async function downloadJSON(url, outputPath = 'data.json') {
    const options = {
        responseType: 'text',
        headers: {
            'Accept': 'application/json'
        }
    };
    
    return await downloadFromLink(url, outputPath, options);
}

/**
 * Função auxiliar para obter extensão baseada no content-type
 * @param {string} contentType - Content-Type do arquivo
 * @returns {string} Extensão do arquivo
 */
function getExtensionFromContentType(contentType) {
    const typeMap = {
        'text/html': '.html',
        'text/plain': '.txt',
        'application/json': '.json',
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'audio/mpeg': '.mp3',
        'video/mp4': '.mp4',
        'application/zip': '.zip',
        'application/xml': '.xml',
        'text/css': '.css',
        'application/javascript': '.js'
    };
    
    return typeMap[contentType] || '';
}

/**
 * Função para baixar múltiplos arquivos
 * @param {Array} urls - Array de URLs para baixar
 * @param {string} outputDir - Diretório de saída
 */
async function downloadMultiple(urls, outputDir = './downloads') {
    console.log(`📁 Baixando ${urls.length} arquivos para: ${outputDir}`);
    
    const results = [];
    
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`\n📥 [${i + 1}/${urls.length}] Baixando: ${url}`);
        
        const result = await downloadFromLink(url, null, {
            headers: {
                'Referer': url
            }
        });
        
        if (result.success) {
            // Mover para o diretório de saída
            const fileName = path.basename(result.fileName);
            const newPath = path.join(outputDir, fileName);
            
            if (fs.existsSync(result.fileName)) {
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                fs.renameSync(result.fileName, newPath);
                result.fileName = newPath;
            }
        }
        
        results.push(result);
        
        // Pequena pausa entre downloads
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`\n🎉 Download concluído! ${successful}/${urls.length} arquivos baixados com sucesso.`);
    
    return results;
}

// Exemplo de uso
async function main() {
    // Verificar se foi fornecido um argumento de linha de comando
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('📋 Script de Download - Uso:');
        console.log('node download.js <URL> [nome_arquivo]');
        console.log('');
        console.log('Exemplos:');
        console.log('node download.js https://example.com/image.jpg');
        console.log('node download.js https://example.com/page.html minha_pagina.html');
        console.log('');
        console.log('Ou use as funções diretamente no código:');
        console.log('- downloadFromLink(url, outputPath)');
        console.log('- downloadWebPage(url, outputPath)');
        console.log('- downloadImage(url, outputPath)');
        console.log('- downloadJSON(url, outputPath)');
        console.log('- downloadMultiple([url1, url2, ...], outputDir)');
        return;
    }
    
    const url = args[0];
    const outputPath = args[1] || null;
    
    console.log('🚀 Iniciando download...');
    const result = await downloadFromLink(url, outputPath);
    
    if (result.success) {
        console.log('✅ Download realizado com sucesso!');
    } else {
        console.log('❌ Falha no download.');
        process.exit(1);
    }
}

// Exportar funções para uso em outros módulos
module.exports = {
    downloadFromLink,
    downloadWebPage,
    downloadImage,
    downloadJSON,
    downloadMultiple
};

// Executar se for o arquivo principal
if (require.main === module) {
    main().catch(console.error);
} 