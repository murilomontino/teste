# Script de Download Node.js

Um script Node.js completo para baixar conteúdo de links, com suporte a diferentes tipos de arquivos e funcionalidades avançadas.

## 🚀 Instalação

1. Clone ou baixe este projeto
2. Instale as dependências:
```bash
npm install
```

## 📋 Funcionalidades

- ✅ Download de qualquer tipo de arquivo
- ✅ Download de páginas web (HTML)
- ✅ Download de imagens
- ✅ Download de arquivos JSON
- ✅ Download múltiplo de arquivos
- ✅ **Download especializado para streams IPTV**
- ✅ Detecção automática de extensão de arquivo
- ✅ Headers personalizáveis
- ✅ Tratamento de erros robusto
- ✅ Progresso em tempo real

## 🎯 Como Usar

### Uso via Linha de Comando

```bash
# Download básico
node download.js https://example.com/arquivo.pdf

# Download com nome personalizado
node download.js https://example.com/imagem.jpg minha_imagem.jpg

# Ver ajuda
node download.js
```

### Uso Programático

```javascript
const { downloadFromLink, downloadWebPage, downloadImage, downloadJSON, downloadMultiple } = require('./download.js');

// Download básico
const result = await downloadFromLink('https://example.com/arquivo.pdf');

// Download de página web
const pageResult = await downloadWebPage('https://example.com', 'pagina.html');

// Download de imagem
const imageResult = await downloadImage('https://example.com/imagem.png');

// Download múltiplo
const urls = ['https://example.com/1.pdf', 'https://example.com/2.jpg'];
const results = await downloadMultiple(urls, './downloads');
```

## 📺 Scripts Especializados para IPTV

### 1. IPTV Downloader (Simula Aplicativos IPTV)

```bash
# Download usando POST (mais comum em IPTV)
node iptv-downloader.js "https://u124.live/get.php?username=xxx&password=xxx&type=m3u_plus&output=ts" stream.m3u

# Download usando GET
node iptv-downloader.js "https://u124.live/get.php?username=xxx&password=xxx&type=m3u_plus&output=ts" stream.m3u
```

**Características:**
- Simula comportamento de aplicativos IPTV reais
- Usa User-Agents de players populares (Perfect Player, VLC, Kodi, etc.)
- Suporte a métodos GET e POST
- Headers específicos para cada aplicativo
- Retry automático com diferentes configurações

### 2. IPTV URL Tester

```bash
# Testa diferentes variações da URL IPTV
node iptv-tester.js "https://u124.live/get.php" "username" "password"
```

**Características:**
- Testa 8 variações diferentes da URL
- Tenta métodos GET e POST para cada variação
- Identifica qual formato funciona melhor
- Salva automaticamente o primeiro resultado bem-sucedido
- Análise detalhada do conteúdo baixado

## 📚 Exemplos

Execute o arquivo de exemplo para ver todas as funcionalidades em ação:

```bash
node exemplo.js
```

## 🔧 Funções Disponíveis

### `downloadFromLink(url, outputPath, options)`
Função principal para download de qualquer tipo de arquivo.

**Parâmetros:**
- `url` (string): URL do arquivo a ser baixado
- `outputPath` (string, opcional): Caminho onde salvar o arquivo
- `options` (object, opcional): Opções adicionais (timeout, headers, etc.)

**Retorna:**
```javascript
{
    success: boolean,
    fileName: string,
    size: number,
    contentType: string,
    error?: string
}
```

### `downloadWebPage(url, outputPath)`
Especializada para download de páginas web.

### `downloadImage(url, outputPath)`
Especializada para download de imagens.

### `downloadJSON(url, outputPath)`
Especializada para download de arquivos JSON.

### `downloadMultiple(urls, outputDir)`
Para baixar múltiplos arquivos de uma vez.

## 🛠️ Opções Avançadas

### Headers Personalizados
```javascript
const result = await downloadFromLink('https://example.com/file', null, {
    headers: {
        'Authorization': 'Bearer token123',
        'Custom-Header': 'value'
    },
    timeout: 60000 // 60 segundos
});
```

### Download com Progresso
```javascript
const result = await downloadFromLink('https://example.com/large-file.zip', null, {
    onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Progresso: ${percentCompleted}%`);
    }
});
```

## 📁 Estrutura do Projeto

```
download-project/
├── download.js          # Script principal de download
├── iptv-downloader.js   # Script especializado para IPTV
├── iptv-tester.js       # Testador de URLs IPTV
├── exemplo.js           # Exemplos de uso
├── package.json         # Dependências
└── README.md           # Este arquivo
```

## 🔍 Tipos de Arquivo Suportados

O script detecta automaticamente e adiciona extensões para:
- HTML (.html)
- Texto (.txt)
- JSON (.json)
- PDF (.pdf)
- Imagens (.jpg, .png, .gif, .webp)
- Áudio (.mp3)
- Vídeo (.mp4)
- Arquivos compactados (.zip)
- XML (.xml)
- CSS (.css)
- JavaScript (.js)
- **Streams IPTV (.m3u, .m3u8)**

## 🎭 Aplicativos IPTV Simulados

O script IPTV simula os seguintes aplicativos:
- Perfect Player IPTV
- VLC Media Player
- Kodi
- IPTV Smarters
- TiviMate
- GSE Smart IPTV
- IPTV Extreme
- Smart IPTV
- OTT Navigator
- Xtream Codes
- M3U Player

## ⚠️ Considerações

- O script usa um User-Agent de navegador para evitar bloqueios
- Timeout padrão de 30 segundos
- Cria automaticamente diretórios se não existirem
- Pausa de 1 segundo entre downloads múltiplos para evitar sobrecarga
- Tratamento robusto de erros com mensagens detalhadas
- **Para IPTV: Simula comportamento de aplicativos reais**

## 🐛 Solução de Problemas

### Erro de Rede
- Verifique sua conexão com a internet
- Tente aumentar o timeout nas opções

### Erro 403/401
- O servidor pode estar bloqueando requisições
- Tente adicionar headers personalizados

### Erro de Permissão
- Verifique se você tem permissão para escrever no diretório de destino

### Erros IPTV Específicos
- **Erro 404**: Credenciais podem ter expirado ou formato não suportado
- **Erro 503**: Servidor sobrecarregado ou temporariamente indisponível
- **Erro 401**: Credenciais inválidas
- Use o `iptv-tester.js` para testar diferentes variações da URL

## 📄 Licença

MIT License - Use livremente para projetos pessoais e comerciais.

## 🤝 Contribuições

Sinta-se à vontade para contribuir com melhorias, correções de bugs ou novas funcionalidades! 