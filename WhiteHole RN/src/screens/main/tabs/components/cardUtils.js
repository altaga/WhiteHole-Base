import emv from 'node-emv';

export const getAID = async info => {
  return new Promise(resolve => {
    emv.describe(info, data => {
      if (data) {
        resolve({
          prefix: data[0].value[1].value[0].value[0].value[0].length,
          AID: data[0].value[1].value[0].value[0].value[0].value,
        });
      } else {
        resolve(null);
      }
    });
  });
};
