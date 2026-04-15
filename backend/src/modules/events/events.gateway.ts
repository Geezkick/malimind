import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_user_channel')
  handleJoinUserRoom(client: Socket, userId: string) {
    client.join(`user_${userId}`);
    return { event: 'joined', data: `user_${userId}` };
  }

  @SubscribeMessage('join_chama_channel')
  handleJoinChamaRoom(client: Socket, chamaId: string) {
    client.join(`chama_${chamaId}`);
    return { event: 'joined', data: `chama_${chamaId}` };
  }

  // Push utilities
  pushDashboardUpdate(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('dashboard_update', payload);
  }

  pushSynergyUpdate(userId: string, payload: any) {
    this.server.to(`user_${userId}`).emit('synergy_update', payload);
  }

  pushChamaUpdate(chamaId: string, payload: any) {
    this.server.to(`chama_${chamaId}`).emit('chama_update', payload);
  }
}
