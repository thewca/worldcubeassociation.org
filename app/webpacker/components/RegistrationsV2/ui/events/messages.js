import Bus from './Bus';

export function setMessage(message, type) {
  Bus.emit('flash', { message, type });
}
