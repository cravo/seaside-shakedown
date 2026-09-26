export const SYMBOLS = { C:'Cherries', L:'Lemon', I:'Ice cream', F:'Chips', G:'Gull', B:'Bell', S:'Lucky seven' };
export const STRIPS = ['CLIFCBLGIS CFLBIGCSLF'.replaceAll(' ',''), 'LCFIGLSCBFLICGSILBFC', 'IFLCBIGLCSFCLIBGFLSC'].map(s=>[...s]);
export const PAYOUTS = {C:8,L:10,I:15,F:20,G:35,B:50,S:100};
export const STAKES = [2,4,10];
export const HOLD_RATE = 8;
export const NUDGE_RATE = 8;
export const SAVE_KEY = 'seaside-shakedown-v1';
export const symbolsAt = indices => indices.map((i,r)=>STRIPS[r][i]);
export const money = units => (units/2).toLocaleString('en-GB',{maximumFractionDigits:1});
