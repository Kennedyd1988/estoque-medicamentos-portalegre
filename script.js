let dadosOriginais = [];
let dadosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 12;

function textoSeguro(valor) {
  return valor === undefined || valor === null || valor === "" ? "-" : String(valor);
}

async function carregarJSON(caminho) {
  try {
    const resposta = await fetch(caminho);
    if (!resposta.ok) throw new Error("Erro ao carregar " + caminho + ": " + resposta.status);
    return await resposta.json();
  } catch (erro) {
    console.error(erro);
    const tabela = document.getElementById("tabelaEstoque");
    if (tabela) {
      tabela.innerHTML = '<tr><td colspan="10" class="linha-vazia">Não foi possível carregar o arquivo de dados do estoque. Verifique se o arquivo dados/estoque-medicamentos.json foi enviado corretamente.</td></tr>';
    }
    return [];
  }
}

function preencherData() {
  const el = document.getElementById("dataHoje");
  if (!el) return;
  const hoje = new Date();
  el.textContent = hoje.toLocaleDateString("pt-BR") + " às " + hoje.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function numeroBR(valor) {
  return Number(String(valor || "0").replace(/\./g, "").replace(",", ".")) || 0;
}

function popularSelect(id, valores) {
  const select = document.getElementById(id);
  if (!select) return;
  const opcoesExistentes = Array.from(select.options).map(opt => opt.value);
  [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")).forEach(valor => {
    if (opcoesExistentes.includes(valor)) return;
    const opt = document.createElement("option");
    opt.value = valor;
    opt.textContent = valor;
    select.appendChild(opt);
  });
}

function preencherResumo() {
  const totalItens = document.getElementById("totalItens");
  const totalMedicamentos = document.getElementById("totalMedicamentos");
  const totalUnidades = document.getElementById("totalUnidades");
  const dataBase = document.getElementById("dataBase");

  if (totalItens) totalItens.textContent = dadosOriginais.length.toLocaleString("pt-BR");
  if (totalMedicamentos) totalMedicamentos.textContent = new Set(dadosOriginais.map(i => textoSeguro(i.codigo) + "|" + textoSeguro(i.medicamento))).size.toLocaleString("pt-BR");
  if (totalUnidades) totalUnidades.textContent = new Set(dadosOriginais.map(i => i.ponto_dispensacao).filter(Boolean)).size.toLocaleString("pt-BR");
  if (dataBase) dataBase.textContent = dadosOriginais[0]?.data_estoque || "-";
}

function aplicarFiltros() {
  const termo = (document.getElementById("campoBusca")?.value || "").toLowerCase();
  const unidade = document.getElementById("filtroUnidade")?.value || "";
  const programa = document.getElementById("filtroPrograma")?.value || "";
  const disponibilidade = document.getElementById("filtroDisponibilidade")?.value || "";

  dadosFiltrados = dadosOriginais.filter(item => {
    const texto = JSON.stringify(item).toLowerCase();
    const okTexto = !termo || texto.includes(termo);
    const okUnidade = !unidade || item.ponto_dispensacao === unidade;
    const okPrograma = !programa || item.programa_saude === programa;
    const okDisponibilidade = !disponibilidade ||
      (disponibilidade === "disponivel" ? numeroBR(item.quantidade) > 0 && item.bloqueado !== "S" : item.bloqueado === "S");
    return okTexto && okUnidade && okPrograma && okDisponibilidade;
  });

  paginaAtual = 1;
  preencherTabela();
}

function preencherTabela() {
  const tabela = document.getElementById("tabelaEstoque");
  if (!tabela) return;

  if (!dadosFiltrados.length) {
    tabela.innerHTML = '<tr><td colspan="10" class="linha-vazia">Nenhum medicamento localizado para os filtros informados.</td></tr>';
    atualizarPaginacao();
    return;
  }

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const pagina = dadosFiltrados.slice(inicio, inicio + itensPorPagina);

  tabela.innerHTML = pagina.map(item => {
    const status = item.bloqueado === "S" ? "Bloqueado" : "Disponível";
    const cls = item.bloqueado === "S" ? "status-bloqueado" : "status-disponivel";
    return `
      <tr>
        <td>${textoSeguro(item.medicamento)}</td>
        <td>${textoSeguro(item.codigo)}</td>
        <td>${textoSeguro(item.unidade_medida)}</td>
        <td>${textoSeguro(item.ponto_dispensacao)}</td>
        <td>${textoSeguro(item.endereco)}</td>
        <td>${textoSeguro(item.programa_saude)}</td>
        <td>${textoSeguro(item.lote)}</td>
        <td>${textoSeguro(item.validade)}</td>
        <td>${textoSeguro(item.quantidade)}</td>
        <td><span class="status ${cls}">${status}</span></td>
      </tr>`;
  }).join("");

  atualizarPaginacao();
}

function atualizarPaginacao() {
  const info = document.getElementById("infoPagina");
  if (!info) return;
  const totalPaginas = Math.max(1, Math.ceil(dadosFiltrados.length / itensPorPagina));
  info.textContent = `Página ${paginaAtual} de ${totalPaginas} · ${dadosFiltrados.length.toLocaleString("pt-BR")} registro(s)`;
}

function paginaAnterior() {
  if (paginaAtual > 1) {
    paginaAtual--;
    preencherTabela();
  }
}

function proximaPagina() {
  const totalPaginas = Math.max(1, Math.ceil(dadosFiltrados.length / itensPorPagina));
  if (paginaAtual < totalPaginas) {
    paginaAtual++;
    preencherTabela();
  }
}

function obterDadosExportacao() {
  return dadosFiltrados.map(i => ({
    "Data do Estoque": i.data_estoque,
    "Medicamento": i.medicamento,
    "Código BR": i.codigo,
    "Unidade de Medida": i.unidade_medida,
    "Ponto de Dispensação": i.ponto_dispensacao,
    "Endereço": i.endereco,
    "Localização Física": i.localizacao_fisica,
    "Programa de Saúde": i.programa_saude,
    "Lote": i.lote,
    "Validade": i.validade,
    "Quantidade": i.quantidade,
    "Bloqueado": i.bloqueado,
    "Valor": i.valor
  }));
}

function baixarArquivo(conteudo, nomeArquivo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(link.href);
}

function nomeBase() { return "estoque-medicamentos-portalegre"; }

function exportarCSV() {
  const dados = obterDadosExportacao();
  if (!dados.length) return alert("Nenhum dado disponível para exportação.");
  const colunas = Object.keys(dados[0]);
  const linhas = [colunas.join(";"), ...dados.map(item => colunas.map(c => `"${String(item[c] ?? "").replace(/"/g, '""')}"`).join(";"))];
  baixarArquivo("\uFEFF" + linhas.join("\n"), nomeBase() + ".csv", "text/csv;charset=utf-8;");
}

function exportarJSON() {
  baixarArquivo(JSON.stringify(obterDadosExportacao(), null, 2), nomeBase() + ".json", "application/json;charset=utf-8;");
}

function exportarXML() {
  const dados = obterDadosExportacao();
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<estoque_medicamentos>\n';
  dados.forEach(item => {
    xml += "  <registro>\n";
    Object.entries(item).forEach(([chave, valor]) => {
      const tag = chave.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const conteudo = String(valor ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      xml += `    <${tag}>${conteudo}</${tag}>\n`;
    });
    xml += "  </registro>\n";
  });
  xml += "</estoque_medicamentos>";
  baixarArquivo(xml, nomeBase() + ".xml", "application/xml;charset=utf-8;");
}

function exportarXLSX() {
  const dados = obterDadosExportacao();
  if (!dados.length) return alert("Nenhum dado disponível para exportação.");
  const planilha = XLSX.utils.json_to_sheet(dados);
  const pasta = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(pasta, planilha, "Estoque");
  XLSX.writeFile(pasta, nomeBase() + ".xlsx");
}

function exportarPDF() {
  const dados = obterDadosExportacao();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape");
  doc.setFontSize(13);
  doc.text("Estoque de Medicamentos - Prefeitura Municipal de Portalegre/RN", 14, 15);
  if (!dados.length) {
    doc.text("Nenhum dado disponível para exportação.", 14, 30);
    doc.save(nomeBase() + ".pdf");
    return;
  }
  const colunas = Object.keys(dados[0]);
  const linhas = dados.map(item => colunas.map(c => item[c]));
  doc.autoTable({ head: [colunas], body: linhas, startY: 24, styles: { fontSize: 6, cellPadding: 1.5 }, headStyles: { fillColor: [15, 86, 52] } });
  doc.save(nomeBase() + ".pdf");
}

async function iniciar() {
  preencherData();
  dadosOriginais = await carregarJSON("dados/estoque-medicamentos.json");
  dadosFiltrados = [...dadosOriginais];
  popularSelect("filtroUnidade", dadosOriginais.map(i => i.ponto_dispensacao));
  popularSelect("filtroPrograma", dadosOriginais.map(i => i.programa_saude));
  preencherResumo();
  preencherTabela();
}

iniciar();
