
import { useEffect, useRef, useState } from 'react';

import './Overview.css';

interface OverviewProps {
  aoSair: () => void | Promise<void>;
}

const etapas = [
  {
    numero: '1',
    icone: (
        <svg width="39" height="28" viewBox="0 0 39 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.055 8.50503H30.555M20.055 14.805H30.555M20.055 21.105H26.355M4.305 22.155C5.355 16.905 15.855 16.905 16.905 22.155M1.155 1.15503H36.855V26.355H1.155V1.15503ZM6.405 10.605C6.405 8.28537 8.28534 6.40503 10.605 6.40503C12.9247 6.40503 14.805 8.28537 14.805 10.605C14.805 12.9247 12.9247 14.805 10.605 14.805C8.28534 14.805 6.405 12.9247 6.405 10.605Z"
        strokeWidth="2.31"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
    ),
    titulo: 'Identificação',
    documentos: [
      'Documento de identidade (RG ou CNH)',
      'CPF ativo',
      'Comprovante de endereço (até 90 dias)',
    ],
    atual: true,
  },
  {
    numero: '2',
    icone: (<svg width="29" height="39" viewBox="0 0 29 39" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M27.405 9.55503L19.005 1.15503H1.15503V36.855H27.405V9.55503ZM19.005 1.15503V9.55503H27.405M13.755 15.855V22.155M13.755 22.155V28.455M13.755 22.155H7.45503M13.755 22.155H20.055" stroke-width="2.31" stroke-linecap="round" stroke-linejoin="round" stroke="#7D8FA6"/>
</svg>
),
    titulo: 'Documentos médicos',
    documentos: [
      'Laudo médico com CID e caracterização da deficiência',
      'Audiograma (perda auditiva bilateral)',
    ],
  },
  {
    numero: '3',
    icone: (<svg width="37" height="31" viewBox="0 0 37 31" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.15503 29.505C1.15503 21.105 5.35503 16.905 11.655 16.905C14.805 16.905 16.905 17.955 18.48 19.53C20.055 17.955 22.155 16.905 25.305 16.905C31.605 16.905 35.805 21.105 35.805 29.505M6.40503 6.40503C6.40503 3.50545 8.75546 1.15503 11.655 1.15503C14.5546 1.15503 16.905 3.50545 16.905 6.40503C16.905 9.3046 14.5546 11.655 11.655 11.655C8.75546 11.655 6.40503 9.3046 6.40503 6.40503ZM20.055 6.40503C20.055 3.50545 22.4055 1.15503 25.305 1.15503C28.2046 1.15503 30.555 3.50545 30.555 6.40503C30.555 9.3046 28.2046 11.655 25.305 11.655C22.4055 11.655 20.055 9.3046 20.055 6.40503Z" stroke-width="2.31" stroke-linecap="round" stroke-linejoin="round" stroke="#7D8FA6"/>
</svg>
),
    titulo: 'Condutores autorizados',
    documentos: [
      'CNH dos 2 condutores (válida e na categoria certa)',
      'Comprovante de vínculo com cada condutor',
    ],
  },
  {
    numero: '4',
    icone: (<svg width="39" height="34" viewBox="0 0 39 34" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31.605 11.655H35.805L19.005 1.15503L2.20503 11.655H6.40503M31.605 11.655H23.205M31.605 11.655V28.455M23.205 11.655H14.805M23.205 11.655V28.455M14.805 11.655H6.40503M14.805 11.655V28.455M6.40503 11.655V28.455M1.15503 32.655H36.855" stroke-width="2.31" stroke-linecap="round" stroke-linejoin="round" stroke="#7D8FA6"/>
</svg>
),
    titulo: 'Renda e acesso gov.br',
    documentos: [
      'Declaração do Imposto de Renda (dispensada se financiar)',
      'Conta gov.br nível bronze ou superior',
    ],
  },
  {
    numero: '5',
    icone: (<svg width="36" height="25" viewBox="0 0 36 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31.605 17.955H34.755V10.605L29.505 1.15503H6.405L1.155 10.605V17.955H4.305M31.605 17.955H26.355M31.605 17.955V23.205H26.355V17.955M26.355 17.955H9.555M9.555 17.955H4.305M9.555 17.955V23.205H4.305V17.955M2.205 10.605H33.705" stroke-width="2.31" stroke-linecap="round" stroke-linejoin="round" stroke="#7D8FA6"/>
</svg>
),
    titulo: 'Dados do veículo',
    documentos: [
      'Modelo 0 km dentro dos requisitos',
      'Valor estimado de até R$ 200 mil',
    ],
  },
  {
    numero: '6',
    icone: (<svg width="32" height="36" viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M24.255 4.30503V1.15503H7.45503V4.30503M24.255 4.30503V11.655C24.255 17.955 20.055 22.155 15.855 22.155M24.255 4.30503H30.555C30.555 10.605 28.455 12.705 24.255 12.705M15.855 22.155C11.655 22.155 7.45503 17.955 7.45503 11.655V4.30503M15.855 22.155V29.505M7.45503 4.30503H1.15503C1.15503 10.605 3.25503 12.705 7.45503 12.705M15.855 29.505H23.205V34.755H8.50503V29.505H15.855Z" stroke-width="2.31" stroke-linecap="round" stroke-linejoin="round" stroke="#7D8FA6"/>
</svg>
),
    titulo: 'Revisão e dossiê',
    documentos: [
      'Revisão final dos dados e documentos',
      'Dossiê organizado para download',
      'Guia de envio pelo SISEN (passo a passo)',
    ],
  },
];

export default function Overview({ aoSair }: OverviewProps) {
  const [menuAberto, setMenuAberto] = useState(false);
  const contaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAberto) {
      return;
    }

    function aoClicarFora(event: MouseEvent) {
      if (!contaRef.current?.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    function aoTeclar(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuAberto(false);
      }
    }

    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);

    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [menuAberto]);

  function irParaVisaoGeral() {
    setMenuAberto(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function sairDaConta() {
    setMenuAberto(false);
    await aoSair();
  }

  return (
    <div className="overview-page">
      <header className="overview-header">
        <div className="overview-logo">isenta+</div>

        <div className="overview-breadcrumb">
          <span> <svg width="69" height="17" viewBox="0 0 69 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 7.75L8 0.75L16 7.75M2 6.25V16.25H14V6.25" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke="#2F5A8F"/>
<path d="M29.476 15V2.508H31.168V15H29.476ZM39.8766 15V10.014C39.8766 9.366 39.6726 8.832 39.2646 8.412C38.8566 7.992 38.3286 7.782 37.6806 7.782C37.2486 7.782 36.8646 7.878 36.5286 8.07C36.1926 8.262 35.9286 8.526 35.7366 8.862C35.5446 9.198 35.4486 9.582 35.4486 10.014L34.7826 9.636C34.7826 8.988 34.9266 8.412 35.2146 7.908C35.5026 7.404 35.9046 7.008 36.4206 6.72C36.9366 6.42 37.5186 6.27 38.1666 6.27C38.8146 6.27 39.3846 6.432 39.8766 6.756C40.3806 7.08 40.7766 7.506 41.0646 8.034C41.3526 8.55 41.4966 9.102 41.4966 9.69V15H39.8766ZM33.8286 15V6.45H35.4486V15H33.8286ZM43.69 15V6.45H45.31V15H43.69ZM43.42 5.172L42.682 4.434L45.022 1.536L46.3 2.814L43.42 5.172ZM51.5862 15.18C50.7462 15.18 49.9842 14.982 49.3002 14.586C48.6282 14.19 48.0942 13.656 47.6982 12.984C47.3142 12.3 47.1222 11.544 47.1222 10.716C47.1222 9.876 47.3142 9.12 47.6982 8.448C48.0942 7.776 48.6282 7.248 49.3002 6.864C49.9842 6.468 50.7462 6.27 51.5862 6.27C52.2462 6.27 52.8582 6.396 53.4222 6.648C53.9862 6.888 54.4722 7.242 54.8802 7.71L53.8002 8.79C53.5362 8.478 53.2122 8.244 52.8282 8.088C52.4562 7.92 52.0422 7.836 51.5862 7.836C51.0462 7.836 50.5662 7.962 50.1462 8.214C49.7262 8.454 49.3962 8.79 49.1562 9.222C48.9162 9.654 48.7962 10.152 48.7962 10.716C48.7962 11.28 48.9162 11.778 49.1562 12.21C49.3962 12.642 49.7262 12.984 50.1462 13.236C50.5662 13.488 51.0462 13.614 51.5862 13.614C52.0422 13.614 52.4562 13.536 52.8282 13.38C53.2122 13.212 53.5422 12.972 53.8182 12.66L54.8802 13.74C54.4842 14.196 53.9982 14.55 53.4222 14.802C52.8582 15.054 52.2462 15.18 51.5862 15.18ZM56.5048 15V6.45H58.1248V15H56.5048ZM57.3148 4.74C57.0148 4.74 56.7688 4.644 56.5768 4.452C56.3848 4.248 56.2888 3.996 56.2888 3.696C56.2888 3.408 56.3848 3.168 56.5768 2.976C56.7688 2.772 57.0148 2.67 57.3148 2.67C57.6148 2.67 57.8608 2.772 58.0528 2.976C58.2448 3.168 58.3408 3.408 58.3408 3.696C58.3408 3.996 58.2448 4.248 58.0528 4.452C57.8608 4.644 57.6148 4.74 57.3148 4.74ZM64.4182 15.18C63.5782 15.18 62.8222 14.982 62.1502 14.586C61.4782 14.19 60.9442 13.656 60.5482 12.984C60.1522 12.3 59.9542 11.538 59.9542 10.698C59.9542 9.87 60.1522 9.126 60.5482 8.466C60.9442 7.794 61.4782 7.26 62.1502 6.864C62.8222 6.468 63.5782 6.27 64.4182 6.27C65.2462 6.27 65.9962 6.468 66.6682 6.864C67.3522 7.248 67.8922 7.776 68.2882 8.448C68.6842 9.12 68.8822 9.87 68.8822 10.698C68.8822 11.538 68.6842 12.3 68.2882 12.984C67.8922 13.656 67.3522 14.19 66.6682 14.586C65.9962 14.982 65.2462 15.18 64.4182 15.18ZM64.4182 13.614C64.9582 13.614 65.4382 13.488 65.8582 13.236C66.2782 12.984 66.6082 12.642 66.8482 12.21C67.0882 11.766 67.2082 11.262 67.2082 10.698C67.2082 10.146 67.0822 9.654 66.8302 9.222C66.5902 8.79 66.2602 8.454 65.8402 8.214C65.4322 7.962 64.9582 7.836 64.4182 7.836C63.8782 7.836 63.3982 7.962 62.9782 8.214C62.5582 8.454 62.2282 8.79 61.9882 9.222C61.7482 9.654 61.6282 10.146 61.6282 10.698C61.6282 11.262 61.7482 11.766 61.9882 12.21C62.2282 12.642 62.5582 12.984 62.9782 13.236C63.3982 13.488 63.8782 13.614 64.4182 13.614Z" fill="#2F5A8F"/>
</svg>
</span>
          <span>/</span>
          <span>Meu processo</span>
        </div>

        <div className="overview-header-actions">
          <button type="button">A−</button>
          <button type="button">A+</button>
          <div className="overview-account-wrap" ref={contaRef}>
            <button
              type="button"
              className="overview-account"
              onClick={() => setMenuAberto((valor) => !valor)}
              aria-expanded={menuAberto}
              aria-haspopup="menu"
              aria-controls="overview-conta-menu"
            >
            <svg width="130" height="24" viewBox="0 0 130 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_99_479)">
<path d="M0 21C0 15.6 3 13.2 7.2 13.2C11.4 13.2 14.4 15.6 14.4 21M3.6 6.6C3.6 4.61172 5.21172 3 7.2 3C9.18828 3 10.8 4.61172 10.8 6.6C10.8 8.58828 9.18828 10.2 7.2 10.2C5.21172 10.2 3.6 8.58828 3.6 6.6Z" stroke-width="1.92" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
<path d="M25.844 19V5.7H27.364L32.893 14.801H31.905L37.434 5.7H38.954V19H36.769V9.538L37.263 9.671L33.159 16.416H31.639L27.535 9.671L28.029 9.538V19H25.844ZM41.5722 19V9.88H43.6622V19H41.5722ZM42.6172 8.208C42.2625 8.208 41.9648 8.08767 41.7242 7.847C41.4962 7.60633 41.3822 7.30867 41.3822 6.954C41.3822 6.59933 41.4962 6.30167 41.7242 6.061C41.9648 5.82033 42.2625 5.7 42.6172 5.7C42.9845 5.7 43.2822 5.82033 43.5102 6.061C43.7382 6.30167 43.8522 6.59933 43.8522 6.954C43.8522 7.30867 43.7382 7.60633 43.5102 7.847C43.2822 8.08767 42.9845 8.208 42.6172 8.208ZM52.2573 19V13.737C52.2573 13.129 52.061 12.6287 51.6683 12.236C51.2883 11.8433 50.7943 11.647 50.1863 11.647C49.781 11.647 49.42 11.7357 49.1033 11.913C48.7866 12.0903 48.5396 12.3373 48.3623 12.654C48.185 12.9707 48.0963 13.3317 48.0963 13.737L47.2793 13.281C47.2793 12.5843 47.4313 11.97 47.7353 11.438C48.0393 10.8933 48.4573 10.469 48.9893 10.165C49.534 9.84833 50.142 9.69 50.8133 9.69C51.4973 9.69 52.1053 9.86733 52.6373 10.222C53.1693 10.564 53.5873 11.0137 53.8913 11.571C54.1953 12.1157 54.3473 12.6857 54.3473 13.281V19H52.2573ZM46.0063 19V9.88H48.0963V19H46.0063ZM62.7221 19V13.737C62.7221 13.129 62.5258 12.6287 62.1331 12.236C61.7531 11.8433 61.2591 11.647 60.6511 11.647C60.2458 11.647 59.8848 11.7357 59.5681 11.913C59.2515 12.0903 59.0045 12.3373 58.8271 12.654C58.6498 12.9707 58.5611 13.3317 58.5611 13.737L57.7441 13.281C57.7441 12.5843 57.8961 11.97 58.2001 11.438C58.5041 10.8933 58.9221 10.469 59.4541 10.165C59.9988 9.84833 60.6068 9.69 61.2781 9.69C61.9621 9.69 62.5701 9.842 63.1021 10.146C63.6341 10.45 64.0521 10.8743 64.3561 11.419C64.6601 11.951 64.8121 12.5717 64.8121 13.281V19H62.7221ZM56.4711 19V5.32H58.5611V19H56.4711ZM70.755 19.19C69.9316 19.19 69.1843 18.981 68.513 18.563C67.8543 18.145 67.3286 17.5813 66.936 16.872C66.556 16.15 66.366 15.3457 66.366 14.459C66.366 13.5597 66.556 12.7553 66.936 12.046C67.3286 11.324 67.8543 10.754 68.513 10.336C69.1843 9.90533 69.9316 9.69 70.755 9.69C71.4516 9.69 72.066 9.842 72.598 10.146C73.1426 10.4373 73.5733 10.8427 73.89 11.362C74.2066 11.8813 74.365 12.4703 74.365 13.129V15.751C74.365 16.4097 74.2066 16.9987 73.89 17.518C73.586 18.0373 73.1616 18.449 72.617 18.753C72.0723 19.0443 71.4516 19.19 70.755 19.19ZM71.097 17.214C71.8696 17.214 72.4903 16.9543 72.959 16.435C73.4403 15.9157 73.681 15.2507 73.681 14.44C73.681 13.8953 73.5733 13.414 73.358 12.996C73.1426 12.578 72.8386 12.255 72.446 12.027C72.066 11.7863 71.6163 11.666 71.097 11.666C70.5903 11.666 70.1406 11.7863 69.748 12.027C69.368 12.255 69.064 12.578 68.836 12.996C68.6206 13.414 68.513 13.8953 68.513 14.44C68.513 14.9847 68.6206 15.466 68.836 15.884C69.064 16.302 69.368 16.6313 69.748 16.872C70.1406 17.1 70.5903 17.214 71.097 17.214ZM73.548 19V16.549L73.909 14.326L73.548 12.122V9.88H75.638V19H73.548ZM85.9602 19.19C85.0608 19.19 84.2438 18.981 83.5092 18.563C82.7872 18.145 82.2172 17.575 81.7992 16.853C81.3812 16.131 81.1722 15.3267 81.1722 14.44C81.1722 13.5407 81.3812 12.7363 81.7992 12.027C82.2172 11.305 82.7872 10.735 83.5092 10.317C84.2438 9.899 85.0608 9.69 85.9602 9.69C86.6695 9.69 87.3282 9.82933 87.9362 10.108C88.5568 10.374 89.0825 10.7603 89.5132 11.267L88.1452 12.654C87.8792 12.3373 87.5562 12.103 87.1762 11.951C86.8088 11.7863 86.4035 11.704 85.9602 11.704C85.4408 11.704 84.9785 11.8243 84.5732 12.065C84.1805 12.293 83.8702 12.6097 83.6422 13.015C83.4268 13.4203 83.3192 13.8953 83.3192 14.44C83.3192 14.972 83.4268 15.447 83.6422 15.865C83.8702 16.2703 84.1805 16.5933 84.5732 16.834C84.9785 17.062 85.4408 17.176 85.9602 17.176C86.4035 17.176 86.8088 17.1 87.1762 16.948C87.5562 16.7833 87.8792 16.5427 88.1452 16.226L89.5132 17.613C89.0825 18.1197 88.5568 18.5123 87.9362 18.791C87.3282 19.057 86.6695 19.19 85.9602 19.19ZM95.0144 19.19C94.1277 19.19 93.3234 18.981 92.6014 18.563C91.8794 18.1323 91.3031 17.556 90.8724 16.834C90.4544 16.112 90.2454 15.3077 90.2454 14.421C90.2454 13.5343 90.4544 12.7363 90.8724 12.027C91.3031 11.3177 91.8794 10.754 92.6014 10.336C93.3234 9.90533 94.1277 9.69 95.0144 9.69C95.9137 9.69 96.7244 9.899 97.4464 10.317C98.1684 10.735 98.7384 11.305 99.1564 12.027C99.5871 12.7363 99.8024 13.5343 99.8024 14.421C99.8024 15.3077 99.5871 16.112 99.1564 16.834C98.7384 17.556 98.1684 18.1323 97.4464 18.563C96.7244 18.981 95.9137 19.19 95.0144 19.19ZM95.0144 17.176C95.5338 17.176 95.9897 17.062 96.3824 16.834C96.7878 16.5933 97.0981 16.264 97.3134 15.846C97.5414 15.428 97.6554 14.953 97.6554 14.421C97.6554 13.889 97.5414 13.4203 97.3134 13.015C97.0854 12.6097 96.7751 12.293 96.3824 12.065C95.9897 11.8243 95.5338 11.704 95.0144 11.704C94.5078 11.704 94.0518 11.8243 93.6464 12.065C93.2537 12.293 92.9434 12.6097 92.7154 13.015C92.5001 13.4203 92.3924 13.889 92.3924 14.421C92.3924 14.953 92.5001 15.428 92.7154 15.846C92.9434 16.264 93.2537 16.5933 93.6464 16.834C94.0518 17.062 94.5078 17.176 95.0144 17.176ZM107.791 19V13.737C107.791 13.129 107.595 12.6287 107.202 12.236C106.822 11.8433 106.328 11.647 105.72 11.647C105.315 11.647 104.954 11.7357 104.637 11.913C104.321 12.0903 104.074 12.3373 103.896 12.654C103.719 12.9707 103.63 13.3317 103.63 13.737L102.813 13.281C102.813 12.5843 102.965 11.97 103.269 11.438C103.573 10.8933 103.991 10.469 104.523 10.165C105.068 9.84833 105.676 9.69 106.347 9.69C107.031 9.69 107.639 9.86733 108.171 10.222C108.703 10.564 109.121 11.0137 109.425 11.571C109.729 12.1157 109.881 12.6857 109.881 13.281V19H107.791ZM101.54 19V9.88H103.63V19H101.54ZM113.281 19V6.08H115.371V19H113.281ZM111.096 11.78V9.88H117.556V11.78H111.096ZM122.634 19.19C121.811 19.19 121.063 18.981 120.392 18.563C119.733 18.145 119.208 17.5813 118.815 16.872C118.435 16.15 118.245 15.3457 118.245 14.459C118.245 13.5597 118.435 12.7553 118.815 12.046C119.208 11.324 119.733 10.754 120.392 10.336C121.063 9.90533 121.811 9.69 122.634 9.69C123.331 9.69 123.945 9.842 124.477 10.146C125.022 10.4373 125.452 10.8427 125.769 11.362C126.086 11.8813 126.244 12.4703 126.244 13.129V15.751C126.244 16.4097 126.086 16.9987 125.769 17.518C125.465 18.0373 125.041 18.449 124.496 18.753C123.951 19.0443 123.331 19.19 122.634 19.19ZM122.976 17.214C123.749 17.214 124.369 16.9543 124.838 16.435C125.319 15.9157 125.56 15.2507 125.56 14.44C125.56 13.8953 125.452 13.414 125.237 12.996C125.022 12.578 124.718 12.255 124.325 12.027C123.945 11.7863 123.495 11.666 122.976 11.666C122.469 11.666 122.02 11.7863 121.627 12.027C121.247 12.255 120.943 12.578 120.715 12.996C120.5 13.414 120.392 13.8953 120.392 14.44C120.392 14.9847 120.5 15.466 120.715 15.884C120.943 16.302 121.247 16.6313 121.627 16.872C122.02 17.1 122.469 17.214 122.976 17.214ZM125.427 19V16.549L125.788 14.326L125.427 12.122V9.88H127.517V19H125.427Z" fill="#16A095"/>
</g>
<defs>
<clipPath id="clip0_99_479">
<rect width="129.4" height="24" fill="white"/>
</clipPath>
</defs>
</svg>

            </button>

            {menuAberto && (
              <div
                className="overview-conta"
                id="overview-conta-menu"
                role="menu"
                aria-label="Menu da conta"
              >
                <div className="overview-conta-topo">
                  <span className="overview-conta-avatar" aria-hidden="true">
                    MS
                  </span>

                  <div className="overview-conta-dados">
                    <strong>Maria Souza Lima</strong>
                    <span>maria.souza@email.com</span>
                  </div>

                  <button
                    type="button"
                    className="overview-conta-editar"
                    aria-label="Editar perfil"
                    onClick={() => setMenuAberto(false)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M12 20H21" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                    </svg>
                  </button>
                </div>

                <div className="overview-conta-divisor" />

                <button
                  type="button"
                  role="menuitem"
                  className="overview-conta-item"
                  onClick={irParaVisaoGeral}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 10.5 12 3l9 7.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                    <path d="M5 9.8V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                  </svg>
                  Visão geral
                </button>

                <button
                  type="button"
                  role="menuitem"
                  className="overview-conta-item overview-conta-item-sair"
                  onClick={sairDaConta}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                    <path d="M16 17l5-5-5-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                    <path d="M21 12H9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
                  </svg>
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="overview-layout">
        <aside className="overview-sidebar">
          <nav className="overview-menu" aria-label="Menu principal">
            <button type="button" className="active">
              <span>🏠︎</span> Visão geral
            </button>
            <button type="button">
              <span className="overview-menu-glyph">𓏬</span>☰ Meu processo
            </button>
            <button type="button">
              <span className="overview-menu-doc">🗎</span> Documentos
            </button>
          </nav>

          <div className="overview-profile">
            <span className="overview-profile-label">SEU PERFIL</span>
            <strong>PcD não condutor</strong>
            <p>
              Deficiência auditiva • 2 condutores autorizados
            </p>
            <button type="button">Refazer quiz</button>
          </div>
        </aside>

        <main className="overview-content">
          <section className="overview-main">
            <div className="overview-intro">
              <h1>
                Vamos organizar sua
                <span> documentação</span>
              </h1>

              <p>
                Siga as etapas no seu ritmo. Cada etapa concluída libera a próxima.
              </p>

              <div className="overview-tags">
                <span>Montado para você:</span>
                <b>PcD não condutor</b>
                <b>Deficiência auditiva</b>
                <b>2 condutores</b>
                <b>Laudo recente</b>
              </div>
            </div>

            <section className="overview-progress">
              <div><svg width="18" height="25" viewBox="0 0 18 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0.909973 23.31V11.41M0.909973 11.41V1.61003M0.909973 11.41H16.31L12.81 6.51003L16.31 1.61003H0.909973M0.909973 1.61003V0.910034" stroke-width="1.82" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
                    </svg>
              </div>

              <div className="overview-progress-info">
                <strong>Seu progresso</strong>
                <span>0 de 6 etapas concluídas</span>
              </div>

              <div
                className="overview-progress-bar"
                role="progressbar"
                aria-label="Progresso do processo"
                aria-valuenow={0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span />
              </div>

              <strong className="overview-progress-percent">0%</strong>
            </section>

            <section className="overview-steps">
              {etapas.map((etapa) => (
                <article
                  key={etapa.numero}
                  className={`overview-step ${
                    etapa.atual ? 'overview-step-current' : ''
                  }`}
                >
                  <div className="overview-step-icon">
                    {etapa.icone}
                  </div>

                  <span className="overview-step-number">
                    {etapa.numero}
                  </span>

                  <div className="overview-step-info">
                    <h2>{etapa.titulo}</h2>
                    <ul>
                      {etapa.documentos.map((documento) => (
                        <li key={documento}>{documento}</li>
                      ))}
                    </ul>
                  </div>

                  {etapa.atual ? (
                    <button type="button" className="overview-start">
                      Começar <span>→</span>
                    </button>
                  ) : (
                    <span
                      className="overview-lock"
                      aria-label="Bloqueado"
                    >
                      <svg width="18" height="21" viewBox="0 0 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 8H1V20H17V8H14M4 8H14M4 8V4C4 0 14 0 14 4V8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke="#7D8FA6"/>
</svg>

                    </span>
                  )}
                </article>
              ))}
            </section>

            <p className="overview-saved">
              ▣ Seu progresso é salvo automaticamente. Você pode sair e
              continuar depois de onde parou.
            </p>
          </section>

          <aside className="overview-right">
            <section className="overview-how">
              <h2>Como funciona?</h2>

              <div className="overview-explanation">
                <span><svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M6.51003 12.1099L10.71 16.3099L18.41 7.90991M0.910034 12.1099C0.910034 5.92415 5.92427 0.909912 12.11 0.909912C18.2958 0.909912 23.31 5.92415 23.31 12.1099C23.31 18.2957 18.2958 23.3099 12.11 23.3099C5.92427 23.3099 0.910034 18.2957 0.910034 12.1099Z" stroke-width="1.82" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg>
</span>
                <div>
                  <strong>Complete cada etapa</strong>
                  <p>
                    Envie os documentos pedidos. Cada etapa concluída libera a próxima.
                  </p>
                </div>
              </div>

              <div className="overview-explanation">
                <span><svg width="20" height="26" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M18.41 6.50991L12.81 0.909912H0.910034V24.7099H18.41V6.50991ZM12.81 0.909912V6.50991H18.41M5.11003 14.2099L7.91003 17.0099L14.21 10.7099" stroke-width="1.82" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
</svg>
</span>
                <div>
                  <strong>Confira antes de avançar</strong>
                  <p>
                    Validamos datas e campos para evitar o indeferimento por erro simples.
                  </p>
                </div>
              </div>

              <div className="overview-explanation">
                <span><svg width="22" height="26" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.81003 12.81L9.31003 16.31L15.61 9.31003M10.71 0.910034L20.51 5.11003V12.11C20.51 18.41 16.31 22.61 10.71 24.71C5.11003 22.61 0.910034 18.41 0.910034 12.11V5.11003L10.71 0.910034Z" stroke-width="1.82" stroke-linecap="round" stroke-linejoin="round" stroke="#16A095"/>
                </svg>
                </span>
                <div>
                  <strong>Envie pelo SISEN</strong>
                  <p>
                    No fim, você recebe o dossiê pronto e o guia para enviar à Receita Federal.
                  </p>
                </div>
              </div>

              <div className="overview-illustration">
                <picture>
                  <source
                    srcSet="/mulher-com-prancheta.webp"
                    type="image/webp"
                  />
                  <img
                    src="/mulher-com-prancheta.png"
                    alt="Mulher cadeirante com prancheta conferindo a documentação do processo de isenção"
                    width={1315}
                    height={1197}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
            </section>

            <section className="overview-deadlines">
              <h2>Prazos importantes</h2>

              <div>
                <b>~5 dias úteis</b>
                <span>Análise padrão da Receita Federal</span>
              </div>

              <div>
                <b>30 dias</b>
                <span>Para responder se a Receita pedir mais documentos</span>
              </div>

              <div>
                <b>270 dias</b>
                <span>Validade da autorização para comprar o veículo</span>
              </div>

              <div>
                <b>5 anos</b>
                <span>Prazo para usar a isenção de novo</span>
              </div>
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
}
