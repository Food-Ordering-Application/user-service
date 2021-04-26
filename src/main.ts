import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // microservice #1
  const userQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.AMQP_URL],
      queue: process.env.USERS_AMQP_QUEUE,
      queueOptions: {
        durable: false,
      },
    },
  });
  const restaurantEventQueue = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.AMQP_URL],
      queue: process.env.RESTAURANT_EVENT_AMQP_QUEUE,
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.startAllMicroservicesAsync();
  await app.listen(3001, () => console.log('User microservice is listening'));
}
bootstrap();
