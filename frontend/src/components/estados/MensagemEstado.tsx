import './MensagemEstado.css';

export type TipoMensagem =
  | 'vazio'
  | 'carregando'
  | 'erro'
  | 'sucesso';

interface MensagemEstadoProps {
  tipo: TipoMensagem;
  mensagem: string;
}

const icones: Record<TipoMensagem, string> = {
  vazio: '•',
  carregando: '⟳',
  erro: '!',
  sucesso: '✓',
};

export default function MensagemEstado({
  tipo,
  mensagem,
}: MensagemEstadoProps) {
  if (!mensagem.trim()) {
    return null;
  }

  return (
    <div
      className={`mensagem-estado mensagem-estado--${tipo}`}
      role={tipo === 'erro' ? 'alert' : 'status'}
      aria-live={tipo === 'erro' ? 'assertive' : 'polite'}
    >
      <span className="mensagem-estado__icone" aria-hidden="true">
        {icones[tipo]}
      </span>

      <span className="mensagem-estado__texto">{mensagem}</span>
    </div>
  );
}