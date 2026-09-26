export const SYMBOLS = { C:'Cherries', L:'Lemon', I:'Ice cream', F:'Chips', G:'Gull', B:'Bell', S:'Lucky seven' };
export const STRIPS = ['CLIFCBLGIS CFLBIGCSLF'.replaceAll(' ',''), 'LCFIGLSCBFLICGSILBFC', 'IFLCBIGLCSFCLIBGFLSC'].map(s=>[...s]);
export const PAYOUTS = {C:8,L:10,I:15,F:20,G:35,B:50,S:100};
export const STAKES = [2,4,10];
export const HOLD_RATE = 8;
export const NUDGE_RATE = 8;
export const NUMBER_STRIPS = [
 [0,1,0,2,1,0,3,0,2,1,0,3,1,2,0,1,0,3,2,0],
 [0,2,1,0,3,0,1,2,0,3,1,0,2,1,0,3,0,1,2,0],
 [0,1,3,0,2,1,0,2,0,1,3,0,1,2,0,3,1,0,2,0]
];
export const SHAKE_HOLD_RATE = 25;
export const SHAKE_TARGET = 9;
export const numbersAt = indices => indices.map((i,r)=>NUMBER_STRIPS[r][i]);
export const SAVE_KEY = 'seaside-shakedown-v1';
export const symbolsAt = indices => indices.map((i,r)=>STRIPS[r][i]);
export const money = units => (units/2).toLocaleString('en-GB',{maximumFractionDigits:1});
