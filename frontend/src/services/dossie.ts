import type { DocumentoSalvo } from './documentosSalvos';

export interface GrupoDossie {
  numero: number;
  titulo: string;
  documentos: DocumentoSalvo[];
}

export interface LinhaResumo {
  numero: number;
  titulo: string;
  detalhe: string;
}

export interface ResumoDossie {
  perfil: string;
  geradoEm: Date;
  linhas: LinhaResumo[];
  grupos: GrupoDossie[];
}

const LARGURA = 595.28;
const ALTURA = 841.89;
const MARGEM = 40;

function ehPdf(documento: DocumentoSalvo): boolean {
  return (
    documento.tipo === 'application/pdf' ||
    documento.nome.toLowerCase().endsWith('.pdf')
  );
}

function ehPng(documento: DocumentoSalvo): boolean {
  return (
    documento.tipo === 'image/png' || documento.nome.toLowerCase().endsWith('.png')
  );
}

function limpar(texto: string, maximo = 90): string {
  const seguro = texto.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?');

  return seguro.length > maximo ? `${seguro.slice(0, maximo - 3)}...` : seguro;
}

function nomeSeguro(texto: string): string {
  return texto.replace(/[\\/:*?"<>|]/g, '-').trim();
}

export function baixarArquivo(blob: Blob, nome: string) {
  const endereco = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = endereco;
  link.download = nome;
  link.click();

  window.setTimeout(() => URL.revokeObjectURL(endereco), 1000);
}

export async function gerarDossiePdf(
  resumo: ResumoDossie
): Promise<{ blob: Blob; ignorados: string[] }> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const pdf = await PDFDocument.create();
  const fonte = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ignorados: string[] = [];

  const azul = rgb(0.09, 0.2, 0.36);
  const cinza = rgb(0.35, 0.45, 0.55);
  const verde = rgb(0.09, 0.63, 0.58);

  let pagina = pdf.addPage([LARGURA, ALTURA]);
  let y = ALTURA - MARGEM;

  function escrever(
    texto: string,
    tamanho: number,
    usarNegrito = false,
    cor = azul,
    espaco = 6
  ) {
    if (y - tamanho < MARGEM) {
      pagina = pdf.addPage([LARGURA, ALTURA]);
      y = ALTURA - MARGEM;
    }

    pagina.drawText(limpar(texto), {
      x: MARGEM,
      y: y - tamanho,
      size: tamanho,
      font: usarNegrito ? negrito : fonte,
      color: cor,
    });

    y -= tamanho + espaco;
  }

  escrever('Dossiê isenta+', 22, true, verde, 10);
  escrever(`Gerado em ${resumo.geradoEm.toLocaleString('pt-BR')}`, 10, false, cinza);
  escrever(`Perfil: ${resumo.perfil}`, 10, false, cinza, 18);

  escrever('Resumo das etapas', 14, true, azul, 8);

  for (const linha of resumo.linhas) {
    escrever(`${linha.numero}. ${linha.titulo} - ${linha.detalhe}`, 10, false, azul, 4);
  }

  y -= 14;
  escrever('Documentos anexados (na ordem)', 14, true, azul, 8);

  let contador = 0;

  for (const grupo of resumo.grupos) {
    escrever(`${grupo.numero}. ${grupo.titulo}`, 11, true, azul, 4);

    for (const documento of grupo.documentos) {
      contador += 1;
      escrever(`${contador}. ${documento.titulo} (${documento.nome})`, 10, false, cinza, 3);
    }

    y -= 6;
  }

  for (const grupo of resumo.grupos) {
    for (const documento of grupo.documentos) {
      try {
        const bytes = await documento.arquivo.arrayBuffer();

        if (ehPdf(documento)) {
          const origem = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const paginas = await pdf.copyPages(origem, origem.getPageIndices());
          paginas.forEach((item) => pdf.addPage(item));
          continue;
        }

        const imagem = ehPng(documento)
          ? await pdf.embedPng(bytes)
          : await pdf.embedJpg(bytes);

        const folha = pdf.addPage([LARGURA, ALTURA]);

        folha.drawText(limpar(`${grupo.numero}. ${grupo.titulo} - ${documento.titulo}`), {
          x: MARGEM,
          y: ALTURA - MARGEM + 4,
          size: 10,
          font: negrito,
          color: azul,
        });

        const larguraUtil = LARGURA - MARGEM * 2;
        const alturaUtil = ALTURA - MARGEM * 2 - 20;
        const escala = Math.min(
          larguraUtil / imagem.width,
          alturaUtil / imagem.height,
          1
        );
        const largura = imagem.width * escala;
        const altura = imagem.height * escala;

        folha.drawImage(imagem, {
          x: (LARGURA - largura) / 2,
          y: ALTURA - MARGEM - 20 - altura,
          width: largura,
          height: altura,
        });
      } catch {
        ignorados.push(documento.nome);
      }
    }
  }

  const bytesFinais = await pdf.save();

  return {
    blob: new Blob([new Uint8Array(bytesFinais)], { type: 'application/pdf' }),
    ignorados,
  };
}

export async function gerarDossieZip(grupos: GrupoDossie[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  for (const grupo of grupos) {
    const pasta = zip.folder(
      `${String(grupo.numero).padStart(2, '0')}-${nomeSeguro(grupo.titulo)}`
    );

    for (const documento of grupo.documentos) {
      pasta?.file(
        `${nomeSeguro(documento.titulo)} - ${nomeSeguro(documento.nome)}`,
        documento.arquivo
      );
    }
  }

  return zip.generateAsync({ type: 'blob' });
}