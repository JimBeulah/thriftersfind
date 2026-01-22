
import { Customer, Order, SalesData, TopCustomerData, CourierData } from './types';
import { PlaceHolderImages } from './placeholder-images';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const today = new Date();
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
