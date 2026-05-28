let estoque = [];
let estoqueFiltrado = [];

let paginaAtual = 1;
const itensPorPagina = 15;

async function carregarDados() {

    const resposta = await fetch("dados/estoque-medicamentos.json");

    estoque = await resposta.json();

    estoqueFiltrado = estoque;

    atualizarIndicadores();
    renderizarTabela();
}

function atualizarIndicadores() {

    document.getElementById("totalRegistros").innerText =
        estoqueFiltrado.length;

    const medicamentos =
        [...new Set(estoqueFiltrado.map(i => i.medicamento))];

    document.getElementById("totalMedicamentos").innerText =
        medicamentos.length;

    const unidades =
        [...new Set(estoqueFiltrado.map(i => i.dispensacao))];

    document.getElementById("totalUnidades").innerText =
        unidades.length;

    document.getElementById("dataPosicao").innerText =
        new Date().toLocaleDateString("pt-BR");
}

function renderizarTabela() {

    const tbody =
        document.getElementById("tabelaEstoque");

    tbody.innerHTML = "";

    const inicio =
        (paginaAtual - 1) * itensPorPagina;

    const fim =
        inicio + itensPorPagina;

    const pagina =
        estoqueFiltrado.slice(inicio, fim);

    pagina.forEach(item => {

        tbody.innerHTML += `
        <tr>
            <td>${item.medicamento}</td>
            <td>${item.codigo_br}</td>
            <td>${item.unidade}</td>
            <td>${item.dispensacao}</td>
            <td>${item.endereco}</td>
            <td>${item.programa}</td>
            <td>${item.lote}</td>
            <td>${item.validade}</td>
            <td>${item.quantidade}</td>
            <td>${item.situacao}</td>
        </tr>
        `;
    });

    atualizarPaginacao();
}

function atualizarPaginacao() {

    const totalPaginas =
        Math.ceil(estoqueFiltrado.length / itensPorPagina);

    document.getElementById("infoPagina").innerText =
        `Página ${paginaAtual} de ${totalPaginas}`;
}

function paginaAnterior() {

    if (paginaAtual > 1) {

        paginaAtual--;

        renderizarTabela();
    }
}

function proximaPagina() {

    const totalPaginas =
        Math.ceil(estoqueFiltrado.length / itensPorPagina);

    if (paginaAtual < totalPaginas) {

        paginaAtual++;

        renderizarTabela();
    }
}

carregarDados();
