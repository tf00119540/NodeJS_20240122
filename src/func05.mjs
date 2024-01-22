// func05.js 檔案
const f1 = (a) => a*a;
export const f3 = (a) => a*a*a;
export const f5 = (a) => a+a;

const a = 10;

// 下面code的方式 不匯出是可以的
// export default f1;
export {a};