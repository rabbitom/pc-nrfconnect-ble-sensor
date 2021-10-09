'use strict';

import { showErrorDialog } from './errorDialogActions';

export const ADD_SENSOR = 'ADD_SENSOR';
export const READ_SENSOR_VALUE = 'READ_SENSOR_VALUE';
export const UPDATE_SENSOR_VALUE = 'UPDATE_SENSOR_VALUE';

function addSensorAction(sensor) {
    return {
        type: ADD_SENSOR,
        sensor
    }
}

export function addSensor(sensor) {
    return addSensorAction(sensor);
}

// function readSensorValueAction(sensor) {
//     return {
//         type: READ_SENSOR_VALUE,
//         sensor
//     };
// }

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