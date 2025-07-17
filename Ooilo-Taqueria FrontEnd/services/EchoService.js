import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

class EchoService {
  constructor() {
    this.echo = null;
  }

  init(token, restaurantId) {
    if (this.echo) {
      this.disconnect();
    }

    this.echo = new Echo({
      broadcaster: 'pusher',
      key: 'your-pusher-key', // Reemplazar con tu clave de Pusher
      cluster: 'your-pusher-cluster', // Reemplazar con tu cluster de Pusher
      forceTLS: true,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    this.echo.private(`restaurant.${restaurantId}`)
      .listen('OrderCreated', (e) => {
        console.log('OrderCreated event received:', e);
        // Emit a custom event that the UI can listen to
        const event = new CustomEvent('order-created', { detail: e.order });
        window.dispatchEvent(event);
      });
  }

  disconnect() {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }
  }
}

export default new EchoService();
