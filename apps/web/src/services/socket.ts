import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('projectx_access_token');
    socket = io('/', {
      auth: {
        token: token ? `Bearer ${token}` : '',
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      // Socket connected
    });
  }
  return socket;
}

export function reconnectSocketWithNewToken(token: string) {
  if (socket) {
    socket.disconnect();
  }
  socket = io('/', {
    auth: {
      token: `Bearer ${token}`,
    },
    transports: ['websocket', 'polling'],
  });
}
