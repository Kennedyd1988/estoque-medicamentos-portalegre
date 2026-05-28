let dadosOriginais=[];let dadosFiltrados=[];let paginaAtual=1;const itensPorPagina=12;
async function carregarJSON(caminho){try{const resposta=await fetch(caminho);if(!resposta.ok)throw new Error(`Erro ao carregar ${caminho}`);return await resposta.json()}catch(erro){console.error(erro);return[]}}
function preencherData(){const el=document.getElementById('dataHoje');if(el){const hoje=new Date();el.textContent=hoje.toLocaleDateString('pt-BR')+' às '+hoje.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}}
function numeroBR(valor){return Number(String(valor||'0').replace(/\./g,'').replace(',','.'))||0}
function popularSelect(id,valores){const select=document.getElementById(id);if(!select)return;const atual=select.value;[...new Set(valores.filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR')).forEach(v=>{const opt=document.createElement('option');opt.value=v;opt.textContent=v;select.appendChild(opt)});select.value=atual}
function preencherResumo(){document.getElementById('totalItens').textContent=dadosOriginais.length.toLocaleString('pt-BR');document.getElementById('totalMedicamentos').textContent=new Set(dadosOriginais.map(i=>i.codigo+'|'+i.medicamento)).size.toLocaleString('pt-BR');document.getElementById('totalUnidades').textContent=new Set(dadosOriginais.map(i=>i.ponto_dispensacao)).size.toLocaleString('pt-BR');document.getElementById('dataBase').textContent=dadosOriginais[0]?.data_estoque||'-'}
function aplicarFiltros(){const termo=(document.getElementById('campoBusca')?.value||'').toLowerCase();const unidade=document.getElementById('filtroUnidade')?.value||'';const programa=document.getElementById('filtroPrograma')?.value||'';const disp=document.getElementById('filtroDisponibilidade')?.value||'';dadosFiltrados=dadosOriginais.filter(item=>{const texto=JSON.stringify(item).toLowerCase();const okTexto=!termo||texto.includes(termo);const okUnidade=!unidade||item.ponto_dispensacao===unidade;const okPrograma=!programa||item.programa_saude===programa;const okDisp=!disp||(disp==='disponivel'?numeroBR(item.quantidade)>0&&item.bloqueado!=='S':item.bloqueado==='S');return okTexto&&okUnidade&&okPrograma&&okDisp});paginaAtual=1;preencherTabela()}
function preencherTabela(){const tabela=document.getElementById('tabelaEstoque');if(!tabela)return;if(!dadosFiltrados.length){tabela.innerHTML='<tr><td colspan="10" class="linha-vazia">Nenhum medicamento localizado para os filtros informados.</td></tr>';atualizarPaginacao();return}const inicio=(paginaAtual-1)*itensPorPagina;const pagina=dadosFiltrados.slice(inicio,inicio+itensPorPagina);tabela.innerHTML=pagina.map(item=>{const status=item.bloqueado==='S'?'Bloqueado':'Disponível';const cls=item.bloqueado==='S'?'status-bloqueado':'status-disponivel';return `<tr><td>${item.medicamento}</td><td>${item.codigo}</td><td>${item.unidade_medida}</td><td>${item.ponto_dispensacao}</td><td>${item.endereco}</td><td>${item.programa_saude}</td><td>${item.lote}</td><td>${item.validade}</td><td>${item.quantidade}</td><td><span class="status ${cls}">${status}</span></td></tr>`}).join('');atualizarPaginacao()}
function atualizarPaginacao(){const totalPaginas=Math.max(1,Math.ceil(dadosFiltrados.length/itensPorPagina));document.getElementById('infoPagina').textContent=`Página ${paginaAtual} de ${totalPaginas} · ${dadosFiltrados.length.toLocaleString('pt-BR')} registro(s)`}
function paginaAnterior(){if(paginaAtual>1){paginaAtual--;preencherTabela()}}
function proximaPagina(){const totalPaginas=Math.max(1,Math.ceil(dadosFiltrados.length/itensPorPagina));if(paginaAtual<totalPaginas){paginaAtual++;preencherTabela()}}
function obterDadosExportacao(){return dadosFiltrados.map(i=>({'Data do Estoque':i.data_estoque,'Medicamento':i.medicamento,'Código BR':i.codigo,'Unidade de Medida':i.unidade_medida,'Ponto de Dispensação':i.ponto_dispensacao,'Endereço':i.endereco,'Localização Física':i.localizacao_fisica,'Programa de Saúde':i.programa_saude,'Lote':i.lote,'Validade':i.validade,'Quantidade':i.quantidade,'Bloqueado':i.bloqueado,'Valor':i.valor}))}
function baixarArquivo(conteudo,nomeArquivo,tipo){const blob=new Blob([conteudo],{type:tipo});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=nomeArquivo;link.click()}
function nomeBase(){return 'estoque-medicamentos-portalegre'}
function exportarCSV(){const dados=obterDadosExportacao();if(!dados.length)return alert('Nenhum dado disponível para exportação.');const colunas=Object.keys(dados[0]);const linhas=[colunas.join(';'),...dados.map(item=>colunas.map(c=>`"${String(item[c]??'').replace(/"/g,'""')}"`).join(';'))];baixarArquivo('﻿'+linhas.join('
'),nomeBase()+'.csv','text/csv;charset=utf-8;')}
function exportarJSON(){baixarArquivo(JSON.stringify(obterDadosExportacao(),null,2),nomeBase()+'.json','application/json;charset=utf-8;')}
function exportarXML(){const dados=obterDadosExportacao();let xml='<?xml version="1.0" encoding="UTF-8"?>
<estoque_medicamentos>
';dados.forEach(item=>{xml+='  <registro>
';Object.entries(item).forEach(([chave,valor])=>{const tag=chave.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]/g,'_').toLowerCase();xml+=`    <${tag}>${String(valor).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</${tag}>
`});xml+='  </registro>
'});xml+='</estoque_medicamentos>';baixarArquivo(xml,nomeBase()+'.xml','application/xml;charset=utf-8;')}
function exportarXLSX(){const dados=obterDadosExportacao();if(!dados.length)return alert('Nenhum dado disponível para exportação.');const planilha=XLSX.utils.json_to_sheet(dados);const pasta=XLSX.utils.book_new();XLSX.utils.book_append_sheet(pasta,planilha,'Estoque');XLSX.writeFile(pasta,nomeBase()+'.xlsx')}
function exportarPDF(){const dados=obterDadosExportacao();const{jsPDF}=window.jspdf;const doc=new jsPDF('landscape');doc.setFontSize(13);doc.text('Estoque de Medicamentos - Prefeitura Municipal de Portalegre/RN',14,15);if(!dados.length){doc.text('Nenhum dado disponível para exportação.',14,30);doc.save(nomeBase()+'.pdf');return}const colunas=Object.keys(dados[0]);const linhas=dados.map(item=>colunas.map(c=>item[c]));doc.autoTable({head:[colunas],body:linhas,startY:24,styles:{fontSize:6,cellPadding:1.5},headStyles:{fillColor:[15,86,52]}});doc.save(nomeBase()+'.pdf')}
async function iniciar(){preencherData();dadosOriginais=await carregarJSON('dados/estoque-medicamentos.json');dadosFiltrados=[...dadosOriginais];popularSelect('filtroUnidade',dadosOriginais.map(i=>i.ponto_dispensacao));popularSelect('filtroPrograma',dadosOriginais.map(i=>i.programa_saude));preencherResumo();preencherTabela()}
function atualizarDataPosicao() {
    const hoje = new Date();

    const dataFormatada =
        hoje.toLocaleDateString("pt-BR");

    const campo = document.getElementById("dataPosicao");

    if (campo) {
        campo.innerText = dataFormatada;
    }
}

atualizarDataPosicao();
iniciar();
