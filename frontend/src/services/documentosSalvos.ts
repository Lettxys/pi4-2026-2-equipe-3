import { lerUsuarioAtivo } from './respostasPerfil';

export interface DocumentoSalvo {
  id: string;
  usuarioId: number;
  etapa: string;
  etapaTitulo: string;
  documentoId: string;
  titulo: string;
  nome: string;
  tamanho: number;
  tipo: string;
  enviadoEm: string;
  arquivo: Blob;
}

interface EntradaDocumento {
  etapa: string;
  etapaTitulo: string;
  documentoId: string;
  titulo: string;
  arquivo: File;
}

const NOME_BANCO = 'isenta-documentos';
const VERSAO_BANCO = 1;
const LOJA = 'documentos';
const INDICE_USUARIO = 'usuarioId';

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível'));
      return;
    }

    const pedido = indexedDB.open(NOME_BANCO, VERSAO_BANCO);

    pedido.onupgradeneeded = () => {
      const banco = pedido.result;

      if (!banco.objectStoreNames.contains(LOJA)) {
        const loja = banco.createObjectStore(LOJA, { keyPath: 'id' });
        loja.createIndex(INDICE_USUARIO, 'usuarioId', { unique: false });
      }
    };

    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function executar<T>(
  modo: IDBTransactionMode,
  operacao: (loja: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const banco = await abrirBanco();

  return new Promise<T>((resolve, reject) => {
    const transacao = banco.transaction(LOJA, modo);
    const requisicao = operacao(transacao.objectStore(LOJA));

    transacao.oncomplete = () => {
      banco.close();
      resolve(requisicao.result);
    };

    transacao.onerror = () => {
      banco.close();
      reject(transacao.error);
    };

    transacao.onabort = () => {
      banco.close();
      reject(transacao.error);
    };
  });
}

export async function salvarDocumento(entrada: EntradaDocumento): Promise<boolean> {
  const usuarioId = lerUsuarioAtivo();

  if (usuarioId === null) {
    return false;
  }

  const registro: DocumentoSalvo = {
    id: `${usuarioId}:${entrada.etapa}:${entrada.documentoId}`,
    usuarioId,
    etapa: entrada.etapa,
    etapaTitulo: entrada.etapaTitulo,
    documentoId: entrada.documentoId,
    titulo: entrada.titulo,
    nome: entrada.arquivo.name,
    tamanho: entrada.arquivo.size,
    tipo: entrada.arquivo.type,
    enviadoEm: new Date().toISOString(),
    arquivo: entrada.arquivo,
  };

  try {
    await executar('readwrite', (loja) => loja.put(registro));
    return true;
  } catch {
    return false;
  }
}

export async function listarDocumentos(): Promise<DocumentoSalvo[]> {
  const usuarioId = lerUsuarioAtivo();

  if (usuarioId === null) {
    return [];
  }

  try {
    const registros = await executar<DocumentoSalvo[]>('readonly', (loja) =>
      loja.index(INDICE_USUARIO).getAll(usuarioId)
    );

    return registros.sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm));
  } catch {
    return [];
  }
}

export async function listarDocumentosDaEtapa(etapa: string): Promise<DocumentoSalvo[]> {
  const todos = await listarDocumentos();

  return todos.filter((documento) => documento.etapa === etapa);
}

export function paraArquivo(documento: DocumentoSalvo): File {
  return new File([documento.arquivo], documento.nome, { type: documento.tipo });
}

export async function removerDocumentosDaEtapa(etapa: string): Promise<void> {
  const documentos = await listarDocumentosDaEtapa(etapa);

  if (documentos.length === 0) {
    return;
  }

  try {
    const banco = await abrirBanco();

    await new Promise<void>((resolve, reject) => {
      const transacao = banco.transaction(LOJA, 'readwrite');
      const loja = transacao.objectStore(LOJA);

      documentos.forEach((documento) => loja.delete(documento.id));

      transacao.oncomplete = () => {
        banco.close();
        resolve();
      };

      transacao.onerror = () => {
        banco.close();
        reject(transacao.error);
      };

      transacao.onabort = () => {
        banco.close();
        reject(transacao.error);
      };
    });
  } catch {
    return;
  }
}