import httpClient from './httpClient';

export const getUsers = (params) => httpClient.get('/users/', { params });

export const createUser = (payload) => httpClient.post('/users/', payload);

export const updateUser = (id, payload) => httpClient.patch(`/users/${id}/`, payload);

export const deleteUser = (id) => httpClient.delete(`/users/${id}/`);
