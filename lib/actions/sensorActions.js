'use strict';

import { logger } from 'nrfconnect/core';
import { showErrorDialog } from './errorDialogActions';
import { getImmutableSensor } from '../utils/sensorApi';
import { 
    discoverCharacteristicsAndDescriptors,
    readCharacteristic,
    writeDescriptor,
} from './deviceDetailsActions';
import { CCCD_UUID } from '../components/AttributeItem';

export const ADD_SENSOR = 'ADD_SENSOR';
export const CLEAR_SENSORS = 'CLEAR_SENSORS';
export const READ_SENSOR_VALUE = 'READ_SENSOR_VALUE';
export const UPDATE_SENSOR_VALUE = 'UPDATE_SENSOR_VALUE';
export const UPDATE_SENSOR_STATUS = 'UPDATE_SENSOR_STATUS';

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

function updateSensorStatusAction(sensor, status) {
    return {
        type: UPDATE_SENSOR_STATUS,
        sensor,
        status
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
        dispatch(readCharacteristic(sensor.characteristic))
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
                        logger.info('sensor characteristic properties', characteristic.properties.read ? 'read' : '', characteristic.properties.notify ? 'notify' : '');
                        sensor.characteristic = characteristic;
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

export function switchSensor(sensor, status) {
    return dispatch =>
        (async () => {
            try {
                const cccdDescriptor = sensor.characteristic.children.find(({uuid}) => uuid === CCCD_UUID);
                if(!cccdDescriptor)
                    throw new Error('cccd descriptor not found');
                await dispatch(writeDescriptor(cccdDescriptor, [status ? 1 : 0, 0]))
                dispatch(updateSensorStatusAction(sensor, status));
            } catch(error) {
                dispatch(showErrorDialog(error));
            }        
        })()
    // return updateSensorStatusAction(sensor, status);
}