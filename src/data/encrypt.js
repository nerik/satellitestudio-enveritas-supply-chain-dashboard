#!/usr/bin/env node

const CryptoJS = require('crypto-js');
const json = require('./supplychain-dataset.json');
const fs = require('fs');

function encodeData(data, password) {
  if (!password) {
    console.log('Without a password we can\'t do it 🤷‍♂️');
    return null;
  }
  return CryptoJS.AES.encrypt(data, password).toString();
}

function saveData(data, password) {
  if (data) {
    fs.writeFile(`${__dirname}/supplychain.json`, JSON.stringify({ data }), function(err) {
      if(err) {
        return console.log(err);
      }
      console.log('The encoded datafile was saved');
    });
  } else {
    console.log('No encoded data to save in file');
  }
}

if (json) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  readline.question('What is the password?\n', (pass) => {
    if (!json) {}
    const encoded = encodeData(JSON.stringify(json), pass);
    saveData(encoded);
    readline.close();
  });
} else {
  console.log('No dataset provided');
}
