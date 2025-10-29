import feathers, { authentication, rest, socketio } from '@feathersjs/client';
// import io from 'socket.io-client';
import axiosClient from './Axios';

const client = feathers();
client.configure(rest(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030').axios(axiosClient))

if(typeof window !== 'undefined') {
  // const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030', {
  //   transports: ['websocket', 'rest'],
  //   forceNew: true
  // });

  client
  // .configure(socketio(socket))
  .configure(
    authentication({
      storage: window.localStorage,
      jwtStrategy: "jwt",
    })
  );
}

export default client;