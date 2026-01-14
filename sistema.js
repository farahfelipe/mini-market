// ===== DIAGNÓSTICO E COMPATIBILIDADE =====
window.onerror = function (msg, url, line, col, error) {
    console.error("Erro: " + msg + " em " + url + ":" + line);
    return false;
};

// ===== DADOS PIX E ADMIN =====
const PIX_CHAVE = "farahfelipe@gmail.com";
const PIX_NOME = "FELIPE FARAH";
const PIX_CIDADE = "SAO PAULO";
const PIN_ADMIN = "2010";

// ===== VARIÁVEIS DE ESTADO =====
let itens = [];
let audioCtx = null;
let produtos = JSON.parse(localStorage.getItem("market_produtos")) || {};
let historicoVendas = JSON.parse(localStorage.getItem("market_vendas")) || [];
let sistemaIniciado = false;

// ===== ELEMENTOS =====
let telaInicial, btnIniciar, logoAdmin, cabecalho, conteudoPrincipal, codigoInput, listaItens, totalEl, horaEl, modalPix, valorPix, qrPix;
let modalCadastro, cadCodigo, cadNome, cadPreco, btnSalvarProd, btnFecharCad;
let btnExportar, btnImportar, fileInput, vendasHojeEl, vendasMesEl, btnLimparVendas, btnExportarExcel, btnCancelar;

// ===== INICIALIZAÇÃO SEGURA =====
document.addEventListener("DOMContentLoaded", () => {
    telaInicial = document.getElementById("telaInicial");
    btnIniciar = document.getElementById("btnIniciar");
    logoAdmin = document.getElementById("logoAdmin");
    cabecalho = document.querySelector(".topo");
    conteudoPrincipal = document.querySelector(".conteudo");
    codigoInput = document.getElementById("codigo");
    listaItens = document.getElementById("listaItens");
    totalEl = document.getElementById("total");
    horaEl = document.getElementById("hora");
    modalPix = document.getElementById("modalPix");
    valorPix = document.getElementById("valorPix");
    qrPix = document.getElementById("qrPix");
    modalCadastro = document.getElementById("modalCadastro");
    cadCodigo = document.getElementById("cadCodigo");
    cadNome = document.getElementById("cadNome");
    cadPreco = document.getElementById("cadPreco");
    btnSalvarProd = document.getElementById("btnSalvarProd");
    btnFecharCad = document.getElementById("btnFecharCad");
    btnExportar = document.getElementById("btnExportar");
    btnImportar = document.getElementById("btnImportar");
    fileInput = document.getElementById("fileInput");
    vendasHojeEl = document.getElementById("vendasHoje");
    vendasMesEl = document.getElementById("vendasMes");
    btnLimparVendas = document.getElementById("btnLimparVendas");
    btnExportarExcel = document.getElementById("btnExportarExcel");
    btnCancelar = document.getElementById("btnCancelar");

    const iniciarFunc = (e) => {
        if (e) e.preventDefault();
        sistemaIniciado = true;
        tocarBip();
        telaInicial.classList.add("hidden");
        cabecalho.classList.remove("hidden");
        conteudoPrincipal.classList.remove("hidden");
        setTimeout(() => { 
            codigoInput.focus(); 
        }, 400);
    };

    btnIniciar.addEventListener("click", iniciarFunc);
    btnIniciar.addEventListener("touchstart", iniciarFunc);

    setInterval(() => {
        if (horaEl) horaEl.textContent = new Date().toLocaleTimeString('pt-BR');
    }, 1000);

    configurarEventos();
});

function tocarBip() {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === "suspended") audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { console.log("Erro som:", e); }
}

function resetarParaInicio() {
    itens = [];
    render();
    telaInicial.classList.remove("hidden");
    cabecalho.classList.add("hidden");
    conteudoPrincipal.classList.add("hidden");
    modalPix.classList.add("hidden");
    sistemaIniciado = false;
    codigoInput.value = "";

    const pixChaveBox = document.getElementById("pixChaveBox");
    if (pixChaveBox) pixChaveBox.classList.add("hidden");
}


function configurarEventos() {
    // LEITURA COM LIMPEZA DE CARACTERES OCULTOS E DELAY DE 100ms
    codigoInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            setTimeout(() => {
                const cod = codigoInput.value.trim().replace(/[^a-zA-Z0-9]/g, "");
                codigoInput.value = "";
                
                if (!cod) return;

                if (!produtos[cod]) { 
                    alert("Produto não cadastrado: " + cod); 
                    return; 
                }
                
                tocarBip();
                const item = itens.find(i => i.codigo === cod);
                if (item) item.qtd++;
                else itens.push({ codigo: cod, ...produtos[cod], qtd: 1 });
                render();
            }, 100);
        }
    });

    btnCancelar.onclick = () => {
        if (confirm("Deseja cancelar a compra e voltar ao início?")) {
            resetarParaInicio();
        }
    };

    let clicks = 0;
    logoAdmin.onclick = () => {
        clicks++;
        if (clicks === 3) {
            const pin = prompt("Digite o PIN de Administrador:");
            if (pin === PIN_ADMIN) {
                modalCadastro.classList.remove("hidden");
                atualizarInterfaceRelatorio();
            } else {
                alert("PIN Incorreto");
            }
            clicks = 0;
        }
        setTimeout(() => { clicks = 0; }, 2000);
    };

    btnSalvarProd.onclick = () => {
        const cod = cadCodigo.value.trim().replace(/[^a-zA-Z0-9]/g, "");
        const nome = cadNome.value.trim();
        const precoVenda = parseFloat(cadPreco.value);
        // Pergunta o custo opcionalmente ao salvar manual
        const precoCusto = parseFloat(prompt("Informe o Preço de Custo (ou deixe 0):", "0")) || 0;

        if (cod && nome && !isNaN(precoVenda)) {
            produtos[cod] = { nome, preco: precoVenda, custo: precoCusto };
            localStorage.setItem("market_produtos", JSON.stringify(produtos));
            alert("Produto Salvo!");
            cadCodigo.value = ""; cadNome.value = ""; cadPreco.value = "";
        }
    };

    btnFecharCad.onclick = () => modalCadastro.classList.add("hidden");

    document.getElementById("btnPix").onclick = () => {
        if (itens.length === 0) return;
    
        const total = itens.reduce((acc, i) => acc + (i.preco * i.qtd), 0);
        valorPix.textContent = `R$ ${total.toFixed(2)}`;
    
        const aviso = document.getElementById("avisoPix");
        aviso.classList.add("hidden");
    
        // >>> ADICIONE ISTO <<<
        const pixChaveBox = document.getElementById("pixChaveBox");
        if (pixChaveBox) pixChaveBox.classList.remove("hidden");
        // >>> FIM <<<
    
        const payload = gerarPayloadPix(PIX_CHAVE, PIX_NOME, PIX_CIDADE, total);
        const url = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodeURIComponent(payload);
    
        qrPix.onload = () => {
            aviso.innerHTML = textoAvisoPix();
            aviso.classList.remove("hidden");
        };
    
        qrPix.src = url;
        modalPix.classList.remove("hidden");
    };
    

    document.getElementById("btnFecharPix").onclick = () => {
        modalPix.classList.add("hidden");
    
        const pixChaveBox = document.getElementById("pixChaveBox");
        if (pixChaveBox) pixChaveBox.classList.add("hidden");
    };
    

    document.getElementById("btnConfirmarPix").onclick = () => {
        const totalVenda = itens.reduce((s, i) => s + i.preco * i.qtd, 0);
        // Calcula o custo total da venda para armazenar o lucro
        const totalCusto = itens.reduce((s, i) => s + (i.custo || 0) * i.qtd, 0);

        if(totalVenda > 0) {
            historicoVendas.push({ 
                data: new Date().toISOString(), 
                valor: totalVenda,
                lucro: totalVenda - totalCusto
            });
            localStorage.setItem("market_vendas", JSON.stringify(historicoVendas));
            alert("Venda Confirmada!");
        }
        resetarParaInicio();
        const pixChaveBox = document.getElementById("pixChaveBox");
if (pixChaveBox) pixChaveBox.classList.add("hidden");
    };

    btnExportar.onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(produtos));
        const a = document.createElement('a');
        a.setAttribute("href", dataStr);
        a.setAttribute("download", "produtos_market.json");
        a.click();
    };

    // ===== IMPORTADOR ULTRA-RESISTENTE COM SUPORTE A CUSTO (4ª COLUNA) =====
    btnImportar.onclick = () => fileInput.click();
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const conteudo = event.target.result;
            try {
                if (file.name.toLowerCase().endsWith('.csv')) {
                    const linhas = conteudo.split(/\r?\n/);
                    let importados = 0;
                    linhas.forEach((linha, index) => {
                        // Ignora o cabeçalho
                        if (index === 0 || !linha.trim()) return;
                        
                        let col = [];
                        if (linha.includes(";")) col = linha.split(";");
                        else if (linha.includes(",")) col = linha.split(",");
                        else col = linha.split("\t");

                        if (col.length >= 3) {
                            const cod = col[0].trim().replace(/[^a-zA-Z0-9]/g, "");
                            const nome = col[1].trim();
                            
                            // CORREÇÃO AQUI: 3ª Coluna (índice 2) é Venda, 4ª Coluna (índice 3) é Custo
                            const precoVenda = parseFloat(col[2].trim().replace(",", "."));
                            const precoCusto = col[3] ? parseFloat(col[3].trim().replace(",", ".")) : 0;

                            if (cod && !isNaN(precoVenda)) {
                                produtos[cod] = { nome, preco: precoVenda, custo: precoCusto };
                                importados++;
                            }
                        }
                    });
                    alert(importados + " produtos importados!");
                } else {
                    produtos = JSON.parse(conteudo);
                    alert("Produtos JSON importados!");
                }
                localStorage.setItem("market_produtos", JSON.stringify(produtos));
                location.reload();
            } catch(err) { alert("Erro na importação: " + err.message); }
        };
        reader.readAsText(file);
    };

    btnExportarExcel.onclick = exportarVendas;

    btnLimparVendas.onclick = () => {
        if(confirm("Deseja ZERAR todo o histórico de vendas?")) {
            historicoVendas = [];
            localStorage.setItem("market_vendas", "[]");
            atualizarInterfaceRelatorio();
        }
    };
}

function render() {
    listaItens.innerHTML = "";
    let total = 0;
    itens.forEach((item, i) => {
        total += item.preco * item.qtd;
        const div = document.createElement("div");
        div.className = "item";
        div.innerHTML = `
            <div class="item-topo"><span>${item.nome}</span><span>R$ ${(item.preco * item.qtd).toFixed(2)}</span></div>
            <div class="controles">
                <button onclick="alterarQtd(${i}, -1)">−</button>
                <strong style="margin: 0 10px">${item.qtd}</strong>
                <button onclick="alterarQtd(${i}, 1)">+</button>
                <span class="remover" style="cursor:pointer; margin-left:15px;" onclick="removerItem(${i})">🗑️</span>
            </div>`;
        listaItens.appendChild(div);
    });
    totalEl.textContent = `R$ ${total.toFixed(2)}`;
}

window.alterarQtd = (i, d) => {
    itens[i].qtd += d;
    if (itens[i].qtd <= 0) itens.splice(i, 1);
    render();
};

window.removerItem = i => {
    if (confirm("Deseja remover este item da lista?")) {
        itens.splice(i, 1);
        render();
    }
};

function gerarPayloadPix(chave, nome, cidade, valor) {
    const f = (id, v) => id + String(v.length).padStart(2, '0') + v;
    let payload = f("00", "01") + f("26", f("00", "br.gov.bcb.pix") + f("01", chave)) +
        f("52", "0000") + f("53", "986") + f("54", valor.toFixed(2)) +
        f("58", "BR") + f("59", nome) + f("60", cidade) + f("62", f("05", "***")) + "6304";
    return payload + crc16(payload);
}

function crc16(data) {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) crc = (crc << 1) ^ 0x1021;
            else crc <<= 1;
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function atualizarInterfaceRelatorio() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const vendasHoje = historicoVendas.filter(v => new Date(v.data).toLocaleDateString('pt-BR') === hoje);
    
    const totalHoje = vendasHoje.reduce((a, b) => a + b.valor, 0);
    const lucroHoje = vendasHoje.reduce((a, b) => a + (b.lucro || 0), 0);

    if(vendasHojeEl) {
        vendasHojeEl.innerHTML = `Vendas Hoje: R$ ${totalHoje.toFixed(2)}<br><small style="color: #2ecc71">Lucro Est.: R$ ${lucroHoje.toFixed(2)}</small>`;
    }
    
    const mesAtual = new Date().getMonth();
    const totalMes = historicoVendas.filter(v => new Date(v.data).getMonth() === mesAtual).reduce((a, b) => a + b.valor, 0);
    if(vendasMesEl) vendasMesEl.textContent = `Total Mês: R$ ${totalMes.toFixed(2)}`;
}

function exportarVendas() {
    let csv = "Data;Valor;Lucro\n";
    historicoVendas.forEach(v => { 
        csv += `${new Date(v.data).toLocaleString()};${v.valor.toFixed(2)};${(v.lucro || 0).toFixed(2)}\n`; 
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio_vendas.csv';
    a.click();
}

function textoAvisoPix() {
    const hora = new Date().getHours();

    if (hora >= 18 || hora < 6) {
        return `
            ⚠️ <strong>Boa noite!</strong><br>
            Após realizar o pagamento via PIX,
            toque em <strong>Pagamento Confirmado</strong>
            para finalizar sua compra.
        `;
    } else {
        return `
            ⚠️ <strong>Atenção!</strong><br>
            Após ler o QR Code e efetuar o pagamento,
            toque em <strong>Pagamento Confirmado</strong>.
        `;
    }
}    