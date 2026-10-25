/**
 * Utility to convert numeric amounts to Spanish words for commercial documents
 * Example: 13198.81 -> "TRECE MIL TRESCIENTOS NOVENTA Y OCHO PESOS 81/100 M.N."
 */

const UNIDADES: string[] = [
  '',
  'UN',
  'DOS',
  'TRES',
  'CUATRO',
  'CINCO',
  'SEIS',
  'SIETE',
  'OCHO',
  'NUEVE',
];

const DECENAS: string[] = [
  '',
  'DIEZ',
  'VEINTE',
  'TREINTA',
  'CUARENTA',
  'CINCUENTA',
  'SESENTA',
  'SETENTA',
  'OCHENTA',
  'NOVENTA',
];

const DIEZ_Y: string[] = [
  'DIEZ',
  'ONCE',
  'DOCE',
  'TRECE',
  'CATORCE',
  'QUINCE',
  'DIECISEIS',
  'DIECISIETE',
  'DIECIOCHO',
  'DIECINUEVE',
];

const VEINTI: string[] = [
  'VEINTE',
  'VEINTIUNO',
  'VEINTIDOS',
  'VEINTITRES',
  'VEINTICUATRO',
  'VEINTICINCO',
  'VEINTISEIS',
  'VEINTISIETE',
  'VEINTIOCHO',
  'VEINTINUEVE',
];

const CENTENAS: string[] = [
  '',
  'CIENTO',
  'DOSCIENTOS',
  'TRESCIENTOS',
  'CUATROCIENTOS',
  'QUINIENTOS',
  'SEISCIENTOS',
  'SETECIENTOS',
  'OCHOCIENTOS',
  'NOVECIENTOS',
];

function leerGrupo(n: number): string {
  let output = '';
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (n === 100) {
    return 'CIEN';
  }

  if (c > 0) {
    output += CENTENAS[c] + ' ';
  }

  if (d === 1) {
    output += DIEZ_Y[u];
    return output.trim();
  } else if (d === 2) {
    if (u === 0) {
      output += 'VEINTE';
    } else {
      output += VEINTI[u];
    }
    return output.trim();
  } else if (d > 2) {
    output += DECENAS[d];
    if (u > 0) {
      output += ' Y ' + UNIDADES[u];
    }
    return output.trim();
  }

  if (u > 0) {
    output += UNIDADES[u];
  }

  return output.trim();
}

export function numeroALetras(monto: number): string {
  if (isNaN(monto) || monto < 0) return 'CERO PESOS 00/100 M.N.';

  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  const strCentavos = centavos.toString().padStart(2, '0') + '/100 M.N.';

  if (entero === 0) {
    return `CERO PESOS ${strCentavos}`;
  }

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const unidades = entero % 1000;

  let texto = '';

  if (millones > 0) {
    if (millones === 1) {
      texto += 'UN MILLON ';
    } else {
      texto += `${leerGrupo(millones)} MILLONES `;
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      texto += 'MIL ';
    } else {
      texto += `${leerGrupo(miles)} MIL `;
    }
  }

  if (unidades > 0) {
    texto += leerGrupo(unidades);
  }

  const textoFinal = texto.trim();
  const palabraPesos = entero === 1 ? 'PESO' : 'PESOS';

  return `${textoFinal} ${palabraPesos} ${strCentavos}`;
}
