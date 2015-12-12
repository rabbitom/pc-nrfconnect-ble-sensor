/* Copyright (c) 2015 Nordic Semiconductor. All Rights Reserved.
 *
 * The information contained herein is property of Nordic Semiconductor ASA.
 * Terms and conditions of usage are described in detail in NORDIC
 * SEMICONDUCTOR STANDARD SOFTWARE LICENSE AGREEMENT.
 *
 * Licensees are granted free, non-transferable use of the information. NO
 * WARRANTY of ANY KIND is provided. This heading must NOT be removed from
 * the file.
 *
 */

'use strict';

export const SELECT_COMPONENT = 'DEVICE_DETAILS_SELECT_COMPONENT';

export const DISCOVERING_ATTRIBUTES = 'DEVICE_DETAILS_DISCOVERING_ATTRIBUTES';
export const DISCOVERED_ATTRIBUTES = 'DEVICE_DETAILS_DISCOVERED_ATTRIBUTES';
export const DISCOVERED_DEVICE_NAME = 'DEVICE_DETAILS_DISCOVERED_DEVICE_NAME';

export const TOGGLED_ATTRIBUTE_EXPANDED = 'DEVICE_DETAILS_TOGGLED_ATTRIBUTE_EXPANDED';

export const WRITE_CHARACTERISTIC = 'DEVICE_DETAILS_WRITE_CHARACTERISTIC';
export const READ_CHARACTERISTIC = 'DEVICE_DETAILS_READ_CHARACTERISTIC';
export const WRITE_DESCRIPTOR = 'DEVICE_DETAILS_WRITE_DESCRIPTOR';
export const READ_DESCRIPTOR = 'DEVICE_DETAILS_READ_DESCRIPTOR';

export const WRITING_ATTRIBUTE = 'DEVICE_DETAILS_WRITING_ATTRIBUTE';
export const READING_ATTRIBUTE = 'DEVICE_DETAILS_READING_ATTRIBUTE';
export const COMPLETED_WRITING_ATTRIBUTE = 'DEVICE_DETAILS_COMPLETED_WRITING_ATTRIBUTE';
export const COMPLETED_READING_ATTRIBUTE = 'DEVICE_DETAILS_COMPLETED_READING_ATTRIBUTE';

export const ERROR_OCCURED = 'DEVICE_DETAILS_ERROR_OCCURED';

import { getInstanceIds } from '../utils/api';

function selectComponentAction(component) {
    return {
        type: SELECT_COMPONENT,
        component: component,
    };
}

// This function shall only be used by Promise.reject calls.
function makeError(data) {
    let {adapter, device, error} = data;

    return {
        adapter: adapter,
        device: device,
        error: error,
    };
}

function _discoverServices(dispatch, getState, device) {
    return new Promise((resolve, reject) => {
        const adapterToUse = getState().adapter.api.selectedAdapter;

        if (adapterToUse === null) {
            dispatch(makeError({error: `No adapter selected`}));
            return;
        }

        dispatch(discoveringAttributesAction(device));

        adapterToUse.getServices(
            device.instanceId,
            (error, services) => {
                if (error) {
                    reject(makeError({adapter: adapterToUse, device: device, error: error}));
                }

                resolve(services);
            }
        );
    }).then(services => {
        dispatch(discoveredAttributesAction(device, services));
        _discoverDeviceName(dispatch, getState, device, services);
    }).catch(error => {
        dispatch(discoveredAttributesAction(device));
        dispatch(errorOccuredAction(error.adapter, error.error));
    });
}

function _discoverDeviceName(dispatch, getState, device, services) {

    return new Promise((resolve, reject) => {
        for (let service of services) {
            if (service.uuid === '1800') {
                resolve(service);
            }
        }

        reject('Could not find GAP service');
    }).then(gapService => {
        return _discoverCharacteristics(dispatch, getState, gapService);
    }).then(characteristics => {
        for (let characteristic of characteristics) {
            if (characteristic.uuid === '2A00') {
                return _readCharacteristic(dispatch, getState, characteristic);
            }
        }

        throw(makeError({error: 'Did not find GAP service'}));
    }).then(value => {
        dispatch(discoveredDeviceNameAction(device, value));
    }).catch(error => {
        dispatch(errorOccuredAction(error.adapter, error.error));
    });
}

function _discoverCharacteristics(dispatch, getState, service) {
    return new Promise((resolve, reject) => {
        const adapterToUse = getState().adapter.api.selectedAdapter;

        if (adapterToUse === null) {
            dispatch(makeError({error: `No adapter selected`}));
            return;
        }

        dispatch(discoveringAttributesAction(service));

        adapterToUse.getCharacteristics(
            service.instanceId,
            (error, characteristics) => {
                if (error) {
                    dispatch(discoveredAttributesAction(service));
                    reject(makeError({adapter: adapterToUse, service: service, error: error}));
                }

                resolve(characteristics);
            }
        );
    }).then(characteristics => {
        dispatch(discoveredAttributesAction(service, characteristics));
        return new Promise((resolve, reject) => resolve(characteristics));
    }).catch(error => {
        console.log(error);
        dispatch(errorOccuredAction(error.adapter, error.error));
    });
}

function _discoverDescriptors(dispatch, getState, characteristic) {
    return new Promise((resolve, reject) => {
        const adapterToUse = getState().adapter.api.selectedAdapter;

        if (adapterToUse === null) {
            reject(makeError({error: `No adapter selected`}));
            return;
        }

        dispatch(discoveringAttributesAction(characteristic));

        adapterToUse.getDescriptors(
            characteristic.instanceId,
            (error, descriptors) => {
                if (error) {
                    dispatch(discoveredAttributesAction(characteristic));
                    reject(makeError({adapter: adapterToUse, characteristic: characteristic, error: error}));
                }

                resolve(descriptors);
            }
        );
    }).then(descriptors => {
        dispatch(discoveredAttributesAction(characteristic, descriptors));
    }).catch(error => {
        console.log(error);
        dispatch(errorOccuredAction(error.adapter, error.error));
    });
}

function _toggleAttributeExpanded(dispatch, getState, attribute) {
    const state = getState();
    const adapterToUse = state.adapter.api.selectedAdapter;

    if (adapterToUse === null) {
        dispatch(errorOccuredAction(undefined, 'No adapter selected'));
        return;
    }

    const instanceIds = getInstanceIds(attribute.instanceId);
    const deviceDetails = state.adapter.getIn(['adapters', state.adapter.selectedAdapter, 'deviceDetails']);
    const service = deviceDetails.devices.get(instanceIds.device).children.get(instanceIds.service);

    if (instanceIds.characteristic) {
        const characteristic = service.children.get(instanceIds.characteristic);
        if (!characteristic.children && !characteristic.expanded && !characteristic.discoveringChildren) {
            dispatch(discoverDescriptors(characteristic));
        }
    } else {
        if (!service.children && !service.expanded && !service.discoveringChildren) {
            dispatch(discoverCharacteristics(service));
        }
    }

    dispatch(toggledAttributeExpandedAction(attribute));
    dispatch(selectComponentAction(attribute));
}

function _readCharacteristic(dispatch, getState, characteristic) {
    return new Promise((resolve, reject) => {
        const adapterToUse = getState().adapter.api.selectedAdapter;

        if (adapterToUse === null) {
            reject(makeError({error: 'No adapter selected'}));
            return;
        }

        dispatch(readingAttributeAction(characteristic));

        adapterToUse.readCharacteristicValue(
            characteristic.instanceId,
            (error, value) => {
                if (error) {
                    dispatch(completedReadingAttributeAction(characteristic, null, error));
                    reject(makeError({adapter: adapterToUse, characteristic: characteristic, error: error}));
                }

                resolve(value);
            }
        );
    }).then(value => {
        dispatch(completedReadingAttributeAction(characteristic, value));
        return new Promise((resolve, reject) => resolve(value));
    }).catch(error => {
        dispatch(errorOccuredAction(error.adapter, error.error));
    });
}

function _writeCharacteristic(dispatch, getState, characteristic, value) {
    return new Promise((resolve, reject) => {
        const adapterToUse = getState().adapter.api.selectedAdapter;

        if (adapterToUse === null) {
            reject(makeError({error: 'No adapter selected'}));
            return;
        }

        dispatch(writingAttributeAction(characteristic));

        let ack;
        if (characteristic.properties.write === true) {
            ack = true;
        } else if (characteristic.properties.write_wo_resp === true) {
            ack = false;
        } else {
            ack = true;
        }

        adapterToUse.writeCharacteristicValue(characteristic.instanceId, value, ack, error => {
            if (error) {
                dispatch(completedWritingAttributeAction(characteristic, null, error));
                reject(makeError({adapter: adapterToUse, characteristic: characteristic, error: error}));
            }

            resolve();
        });
    }).then(() => {
        dispatch(completedWritingAttributeAction(characteristic, value));
    }).catch(error => {
        dispatch(errorOccuredAction(error.adapter, error.error));
    });
}

function _readDescriptor(dispatch, getState, descriptor) {
    return new Promise((resolve, reject) => {
        const adapterToUse = getState().adapter.api.selectedAdapter;

        if (adapterToUse === null) {
            reject(makeError({error: 'No adapter selected'}));
            return;
        }

        dispatch(readingAttributeAction(descriptor));

        adapterToUse.readDescriptorValue(
            descriptor.instanceId,
            (error, value) => {
                if (error) {
                    dispatch(completedReadingAttributeAction(descriptor, null, error));
                    reject(makeError({adapter: adapterToUse, descriptor: descriptor, error: error}));
                }

                resolve(value);
            }
        );
    }).then(value => {
        dispatch(completedReadingAttributeAction(descriptor, value));
    }).catch(error => {
        dispatch(errorOccuredAction(error.adapter, error.error));
    });
}

function _writeDescriptor(dispatch, getState, descriptor, value) {
    return new Promise((resolve, reject) => {
        const adapterToUse = getState().adapter.api.selectedAdapter;

        if (adapterToUse === null) {
            reject(makeError({error: 'No adapter selected'}));
            return;
        }

        dispatch(writingAttributeAction(descriptor));

        adapterToUse.writeDescriptorValue(
            descriptor.instanceId,
            value,
            true, // request ack (write request)
            error => {
                if (error) {
                    dispatch(completedWritingAttributeAction(descriptor, null, error));
                    reject(makeError({adapter: adapterToUse, descriptor: descriptor, error: error}));
                }

                resolve();
            }
        );
    }).then(() => {
        dispatch(completedWritingAttributeAction(descriptor, value));
    }).catch(error => {
        dispatch(errorOccuredAction(error.adapter, error.error));
    });
}

function discoveringAttributesAction(parent) {
    return {
        type: DISCOVERING_ATTRIBUTES,
        parent,
    };
}

function discoveredAttributesAction(parent, attributes) {
    return {
        type: DISCOVERED_ATTRIBUTES,
        parent,
        attributes,
    };
}

function discoveredDeviceNameAction(device, value) {
    return {
        type: DISCOVERED_DEVICE_NAME,
        device,
        value,
    };
}

function toggledAttributeExpandedAction(attribute) {
    return {
        type: TOGGLED_ATTRIBUTE_EXPANDED,
        attribute,
    };
}

function readingAttributeAction(attribute) {
    return {
        type: READING_ATTRIBUTE,
        attribute,
    };
}

function writingAttributeAction(attribute) {
    return {
        type: WRITING_ATTRIBUTE,
        attribute,
    };
}

function completedReadingAttributeAction(attribute, value, error) {
    return {
        type: COMPLETED_READING_ATTRIBUTE,
        attribute,
        value,
        error,
    };
}

function completedWritingAttributeAction(attribute, value, error) {
    return {
        type: COMPLETED_WRITING_ATTRIBUTE,
        attribute,
        value,
        error,
    };
}

function errorOccuredAction(adapter, error) {
    return {
        type: ERROR_OCCURED,
        adapter,
        error,
    };
}

export function selectComponent(component) {
    return selectComponentAction(component);
}

export function discoverServices(device) {
    return (dispatch, getState) => {
        return _discoverServices(dispatch, getState, device);
    };
}

export function discoverDeviceName(device) {
    return (dispatch, getState) => {
        return _discoverDeviceName(dispatch, getState, device);
    };
}

export function discoverCharacteristics(service) {
    return (dispatch, getState) => {
        return _discoverCharacteristics(dispatch, getState, service);
    };
}

export function discoverDescriptors(characteristic) {
    return (dispatch, getState) => {
        return _discoverDescriptors(dispatch, getState, characteristic);
    };
}

export function toggleAttributeExpanded(attribute) {
    return (dispatch, getState) => {
        return _toggleAttributeExpanded(dispatch, getState, attribute);
    };
}

export function readCharacteristic(characteristic) {
    return (dispatch, getState) => {
        return _readCharacteristic(dispatch, getState, characteristic);
    };
}

export function writeCharacteristic(characteristic, value) {
    return (dispatch, getState) => {
        return _writeCharacteristic(dispatch, getState, characteristic, value);
    };
}

export function readDescriptor(descriptor) {
    return (dispatch, getState) => {
        return _readDescriptor(dispatch, getState, descriptor);
    };
}

export function writeDescriptor(descriptor, value) {
    return (dispatch, getState) => {
        return _writeDescriptor(dispatch, getState, descriptor, value);
    };
}
