const { Client, LocalAuth } = require ('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const fsExtra = require('fs-extra');
const sharp = require('sharp');
const path = require('path');
const { exec } = require('child_process');


// Buat instance klien WhatsApp
const client = new Client({
  authStrategy: new LocalAuth()
});
exports.client = client;

// Tampilkan QR code di terminal untuk login WhatsApp Web
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('Scan QR code ini dengan WhatsApp Anda.');
});

// Event listener ketika klien siap
client.on('ready', () => {
  console.log('Bot WhatsApp siap!');
});



 // pembuatan foto menjadi stiker apa bila kita mengirim foto ke bot
client.on('message', async (message) => {
    if(message.body === 'ping'){
        message.reply('pong');
    } else if(message.type === 'image' && message.body.startsWith('stiker')){
        const media = await message.downloadMedia();
        client.sendMessage(message.from, media, {sendMediaAsSticker: true})
    }
});



client.on('message', async msg => {
    if (msg.body.startsWith('!hapus')) {
        const chat = await msg.getChat();
        const messages = await chat.fetchMessages({ limit: 10 });

        // Menghapus pesan yang dikirim oleh bot
        for (let message of messages) {
            if (message.fromMe) {
                await message.delete(true);
            }
        }
    }
});




// dowload link//
client.on('message', async msg => {
  // Cek apakah pesan berisi link
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const links = msg.body.match(urlPattern);

  if (links) {
      for (let link of links) {
          try {
              const response = await axios({
                  method: 'GET',
                  url: link,
                  responseType: 'stream'
              });

              // Ambil nama file dari URL atau buat nama file default
              const fileName = path.basename(link.split('?')[0]) || 'downloaded-file';
              const downloadPath = path.join('./downloaded-files', fileName);

              // Pastikan direktori ada
              
              if (!fs.existsSync('./downloaded-files')) {
                  fs.mkdirSync('./downloaded-files');
              }

              // Tulis stream ke file
              const writer = fs.createWriteStream(downloadPath);
              response.data.pipe(writer);

              writer.on('finish', () => {
                  console.log(`File downloaded successfully: ${downloadPath}`);
                  client.sendMessage(msg.from, `File downloaded: ${downloadPath}`);
              });

              writer.on('error', (err) => {
                  console.error(`Failed to download file: ${err.message}`);
                  client.sendMessage(msg.from, `Failed to download file: ${err.message}`);
              });

          } catch (error) {
              console.error(`Error downloading file from ${link}: ${error.message}`);
              client.sendMessage(msg.from, `Error downloading file from ${link}: ${error.message}`);
          }
      }
  }
});




// Mulai klien
client.initialize();