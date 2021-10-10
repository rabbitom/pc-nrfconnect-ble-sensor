'use strict';

import { logger } from 'nrfconnect/core';
import { showErrorDialog } from './errorDialogActions';
import { getImmutableSensor } from '../utils/sensorApi';
import { discoverCharacteristicsAndDescriptors, readCharacteristic } from './deviceDetailsActions';

export const ADD_SENSOR = 'ADD_SENSOR';
export const CLEAR_SENSORS = 'CLEAR_SENSORS';
export const READ_SENSOR_VALUE = 'READ_SENSOR_VALUE';
export const UPDATE_SENSOR_VALUE = 'UPDATE_SENSOR_VALUE';

const defaultDeviceDefinition = require('../../NordicThingy52.json');

function getSensorList(deviceDefinition) {
    const { services } = deviceDefinition;
    const sensors = [];
    services.forEach(({uuid,characteristics}) => {
        characteristics.forEach(characteristic => {
            if(characteristic.function === 'feature')
                sensors.push({
                    ...characteristic,
                    serviceUuid: uuid.replace(/-/g,''),
                    characteristicUuid: characteristic.uuid.replace(/-/g,''),
                });
        })
    });
    return sensors;
}

function addSensorAction(sensor) {
    return {
        type: ADD_SENSOR,
        sensor
    }
}

function clearSensorsAction() {
    return {
        type: CLEAR_SENSORS
    }
}

function updateSensorValueAction(sensor, value, error) {
    return {
        type: UPDATE_SENSOR_VALUE,
        sensor,
        value,
        error,
    };
}

export function readSensorValue(sensor) {
    return (dispatch, getState) =>
        new Promise((resolve, reject) => {
            const adapterToUse = getState().app.adapter.bleDriver.adapter;

            if (adapterToUse === null) {
                reject(new Error('No adapter selected'));
                return;
            }

            adapterToUse.readCharacteristicValue(
                sensor.characteristicId,
                (error, value) => {
                    if (error) {
                        dispatch(
                            updateSensorValueAction(
                                sensor,
                                null,
                                error
                            )
                        );
                        reject(new Error(error.message));
                        return;
                    }

                    resolve(value);
                }
            );
        })
        .then(value => {
            dispatch(
                updateSensorValueAction(sensor, value)
            );
            return value;
        })
        .catch(error => {
            dispatch(showErrorDialog(error));
        });
}

function getDeviceSensor(device, sensor) {
    return (dispatch, getState) =>
        new Promise((resolve, reject) => {
            logger.info('looking for sensor characteristic', sensor.id);
            logger.info('sensor service uuid', sensor.serviceUuid);
            logger.info('sensor characteristic uuid', sensor.characteristicUuid);
            const service = device.children.find(({uuid}) => uuid === sensor.serviceUuid)
            logger.info('sensor service', service ? 'found' : 'not exist');
            if(service) {
                const findSensorCharacteristic = characteristics => {
                    const characteristic = characteristics.find(({uuid}) => uuid === sensor.characteristicUuid);
                    logger.info('sensor characteristic', characteristic ? 'found' : 'not exist');
                    if(characteristic) {
                        sensor.characteristicId = characteristic.instanceId;
                        dispatch(addSensorAction(getImmutableSensor(sensor)));
                    }
                }
                if(service.children && service.children.size > 0)
                    findSensorCharacteristic(service.children);
                else
                    dispatch(discoverCharacteristicsAndDescriptors(service)).then(findSensorCharacteristic);
            }
        })
}

export function getDeviceSensors(device) {
    logger.info("get device sensors");
    return (dispatch, getState) =>
        new Promise((resolve, reject) => {
            const adapter = getState().app.adapter.selectedAdapter;
            if(!adapter) {
                reject(new Error('no adapter selected'));
                return;
            }
            const { devices } = adapter.deviceDetails;
            const deviceWithDetails = devices.get(device.instanceId);
            const [ sensor ] = getSensorList(defaultDeviceDefinition);
            sensor.id = `${device.instanceId}.sensor.${sensor.name}`;
            dispatch(getDeviceSensor(deviceWithDetails, sensor));
        })
        .catch(error => {
            dispatch(showErrorDialog(error));
        });
}