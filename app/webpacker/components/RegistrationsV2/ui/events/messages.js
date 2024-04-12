import Bus from './Bus';

export default function setMessage(message, type) {
  Bus.emit('flash', { message, type });
}
