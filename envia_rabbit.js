const http = require('http');
const fs = require('fs');
const amqp = require('amqplib');
const util = require('util');

// Configuración de RabbitMQ
const rabbitmqUrl = 'amqp://michael:michael@192.168.100.134:15672';
const exchangeName = 'myExchange';
const routingKey = 'file.upload';

// Configuración del servidor HTTP
const port = 3000;
const filePath = 'C:/xampp/htdocs/Programacion/datos.log';

const startServer = async () => {
  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST') {
      if (req.url === '/upload') {
        try {
          const fileData = fs.readFileSync(filePath);

          // Conectarse a RabbitMQ y enviar el archivo
          const connection = await amqp.connect(rabbitmqUrl);
          const channel = await connection.createChannel();

          // Declarar el intercambio
          await channel.assertExchange(exchangeName, 'direct', { durable: false });

          // Publicar el archivo en el intercambio
          channel.publish(exchangeName, routingKey, Buffer.from(fileData), { persistent: false });

          res.statusCode = 200;
          res.end('Archivo enviado correctamente a RabbitMQ');
        } catch (error) {
          console.error('Error:', error);
          res.statusCode = 500;
          res.end('Error interno del servidor');
        }
      } else {
        res.statusCode = 404;
        res.end('Página no encontrada');
      }
    }
  });

  // Iniciar el servidor
  await util.promisify(server.listen).call(server, port);
  console.log(`Servidor escuchando en http://localhost:${port}`);
};

startServer().catch(error => {
  console.error('Error al iniciar el servidor:', error);
});
