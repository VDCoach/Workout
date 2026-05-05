export function calculateEMA(dataArray, period) {
  const k = 2 / (period + 1);
  const emaArray = [];
  let currentEMA = null;

  for (let i = 0; i < dataArray.length; i++) {
    const val = dataArray[i];
    if (currentEMA === null) {
      if (i === 0) {
        let firstVal = 0;
        for(let j=0; j<dataArray.length; j++) {
            if(dataArray[j] !== null) { firstVal = dataArray[j]; break; }
        }
        currentEMA = firstVal;
      }
    }
    const actualVal = val !== null ? val : (currentEMA !== null ? currentEMA : 0);
    currentEMA = (actualVal * k) + (currentEMA * (1 - k));
    
    emaArray.push(currentEMA);
  }
  return emaArray;
}
