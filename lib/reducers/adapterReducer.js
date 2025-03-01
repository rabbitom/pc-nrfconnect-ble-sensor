/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

'use strict';

import { List, Record, Set } from 'immutable';
import { logger } from 'nrfconnect/core';
import { combineReducers } from 'redux';

import * as AdapterAction from '../actions/adapterActions';
import * as DeviceDetailsActions from '../actions/deviceDetailsActions';
import * as SecurityActions from '../actions/securityActions';
import * as ServerSetupActions from '../actions/serverSetupActions';
import { persistentStore } from '../common/Persistentstore';
import {
    CONN_INTERVAL_MIN,
    CONN_LATENCY_MIN,
} from '../components/ConnectionUpdateRequestEditor';
import * as apiHelper from '../utils/api';
import deviceDetails from './deviceDetailsReducer';
import security from './securityReducer';
import serverSetup from './serverSetupReducer';

const defaultConnectionParams = {
    connectionInterval: CONN_INTERVAL_MIN,
    slaveLatency: CONN_LATENCY_MIN,
    connectionSupervisionTimeout: 4000,
};

const ImmutableRoot = Record({
    bleDriver: { adapter: null },
    selectedAdapter: null,
    autoConnUpdate: persistentStore.autoConnUpdate(),
    ignoredDeviceAddresses: Set(),
    errors: List(),
    showConnectionParams: false,
    connectionParameters: persistentStore.connectionParams({
        ...defaultConnectionParams,
    }),
});

function getImmutableRoot() {
    return new ImmutableRoot();
}

function openAdapter(state, adapter) {
    logger.info(`Opening adapter connected to ${adapter.state.port}`);
    return state.set('selectedAdapter', apiHelper.getImmutableAdapter(adapter));
}

function adapterOpened(oldState, adapter) {
    const state = oldState;
    logger.info(`Adapter connected to ${adapter.state.port} opened`);
    state.bleDriver.adapter = adapter;

    return state;
}

function adapterStateChanged(state, adapter, adapterState) {
    const immutableState = apiHelper.getImmutableAdapterState(adapterState);
    return state.setIn(['selectedAdapter', 'state'], immutableState);
}

function closeAdapter(oldState) {
    let state = oldState;
    state.bleDriver.adapter = null;

    state = state.set('selectedAdapter', null);

    return state;
}

function adapterError(oldState, adapter, error) {
    let state = oldState;
    logger.error(`Error on adapter ${adapter.state.port}: ${error.message}`);
    logger.debug(error.description);

    state.bleDriver.selectedAdapter = null;
    state = state.set('selectedAdapter', null);
    state = state.set('errors', state.errors.push(error.message));

    return state;
}

function adapterResetPerformed(state, adapter) {
    logger.info(`Reset performed on adapter ${adapter.state.port}`);

    return state
        .setIn(['selectedAdapter', 'isServerSetupApplied'], false)
        .updateIn(['selectedAdapter', 'connectedDevices'], connectedDevices =>
            connectedDevices.clear()
        );
}

function adapterScanTimeout(state, adapter) {
    logger.info(`Scanning timed out on adapter ${adapter.state.port}`);
    return state;
}

function adapterAdvertisementTimeout(state, adapter) {
    logger.info(`Advertisement timed out on adapter ${adapter.state.port}`);
    return state;
}

function deviceConnect(state) {
    logger.info('Connecting to device');
    return state;
}

function deviceConnected(oldState, device) {
    let state = oldState;
    if (device.address === undefined) {
        return state;
    }
    logger.info(
        `Connected to device ${device.address}: interval: ${state.connectionParameters.connectionInterval}ms, timeout: ${state.connectionParameters.connectionSupervisionTimeout}ms, latency: ${state.connectionParameters.slaveLatency}`
    );

    const Ldevice = apiHelper.getImmutableDevice(device);

    state = state.updateIn(
        ['selectedAdapter', 'connectedDevices'],
        connectedDevices => connectedDevices.set(Ldevice.instanceId, Ldevice)
    );

    const bonded = state.getIn([
        'selectedAdapter',
        'security',
        'bondStore',
        device.address,
    ]);
    if (bonded) {
        state = state.setIn(
            [
                'selectedAdapter',
                'connectedDevices',
                Ldevice.instanceId,
                'bonded',
            ],
            true
        );
    }

    return state;
}

function deviceConnectCanceled(state) {
    logger.info('Connect canceled');
    return state;
}

function connectedDeviceUpdated(oldState, device) {
    let state = oldState;
    if (device.address === undefined) {
        return state;
    }

    logger.info(
        `Connection parameters updated for device ${device.address}: interval ${device.minConnectionInterval}ms, timeout ${device.connectionSupervisionTimeout}ms, latency: ${device.slaveLatency}`
    );

    const nodePath = ['selectedAdapter', 'connectedDevices', device.instanceId];
    state = state.setIn(
        nodePath.concat('minConnectionInterval'),
        device.minConnectionInterval
    );
    state = state.setIn(
        nodePath.concat('maxConnectionInterval'),
        device.maxConnectionInterval
    );
    state = state.setIn(nodePath.concat('slaveLatency'), device.slaveLatency);
    state = state.setIn(
        nodePath.concat('connectionSupervisionTimeout'),
        device.connectionSupervisionTimeout
    );
    return state;
}

function connectedDevicePhyUpdated(oldState, device) {
    let state = oldState;
    if (device.address === undefined) {
        return state;
    }

    const str = ['AUTO', '1 Mb/s', '2 Mb/s', 'CODED'];
    logger.info(
        `Phy updated for device ${device.address}, tx: ${
            str[device.txPhy]
        }, rx: ${str[device.rxPhy]}`
    );

    const nodePath = ['selectedAdapter', 'connectedDevices', device.instanceId];
    state = state.setIn(nodePath.concat('rxPhy'), device.rxPhy);
    state = state.setIn(nodePath.concat('txPhy'), device.txPhy);
    return state;
}

function connectedDeviceMtuUpdated(oldState, device, mtu) {
    let state = oldState;
    if (device.address === undefined) {
        return state;
    }

    logger.info(
        `ATT MTU updated for device ${device.address}, new value is ${mtu}`
    );

    const nodePath = ['selectedAdapter', 'connectedDevices', device.instanceId];
    state = state.setIn(nodePath.concat('mtu'), mtu);
    return state;
}

function connectedDeviceDataLengthUpdated(oldState, device) {
    let state = oldState;
    if (device.address === undefined) {
        return state;
    }

    logger.info(
        `Data length updated for device ${device.address}, new value is ${device.dataLength}`
    );

    const nodePath = ['selectedAdapter', 'connectedDevices', device.instanceId];
    state = state.setIn(nodePath.concat('dataLength'), device.dataLength);
    return state;
}

function deviceDisconnected(state, device, reason) {
    const str = reason ? `, reason: ${reason}` : '';
    logger.info(`Disconnected from device ${device.address}${str}`);
    return state.deleteIn([
        'selectedAdapter',
        'connectedDevices',
        device.instanceId,
    ]);
}

function deviceInitiatePairing(state) {
    logger.info('Pairing initiated');
    return state;
}

function deviceSecurityChanged(state, device, parameters) {
    if (device.address === undefined) {
        return state;
    }

    logger.info(
        `Security updated, mode:${parameters.securityMode}, level:${parameters.securityLevel} `
    );

    return state
        .setIn(
            [
                'selectedAdapter',
                'connectedDevices',
                device.instanceId,
                'securityMode',
            ],
            parameters.securityMode
        )
        .setIn(
            [
                'selectedAdapter',
                'connectedDevices',
                device.instanceId,
                'securityLevel',
            ],
            parameters.securityLevel
        );
}

function disableDeviceEvents(state, deviceAddress) {
    return state.set(
        'ignoredDeviceAddresses',
        state.ignoredDeviceAddresses.add(deviceAddress)
    );
}

function enableDeviceEvents(state, deviceAddress) {
    return state.set(
        'ignoredDeviceAddresses',
        state.ignoredDeviceAddresses.remove(deviceAddress)
    );
}

function discoveredDeviceName(state, device, value) {
    if (!value) {
        return state;
    }

    if (device.address === undefined) {
        return state;
    }

    const nameBuffer = Buffer.from(value);
    const name = nameBuffer.toString('utf8');

    return state.setIn(
        ['selectedAdapter', 'connectedDevices', device.instanceId, 'name'],
        name
    );
}

function addError(state, error) {
    logger.error(
        error.message ||
            error ||
            'Error does not contain a message! Something is wrong!'
    );

    if (error.description) {
        logger.debug(error.description);
    }

    return state.update('errors', errors => errors.push(error.message));
}

function toggleAutoConnUpdate(state) {
    persistentStore.setAutoConnUpdate(!state.autoConnUpdate);
    return state.set('autoConnUpdate', !state.autoConnUpdate);
}

function addBondInfo(state, device) {
    return state.setIn(
        ['selectedAdapter', 'connectedDevices', device.instanceId, 'bonded'],
        true
    );
}

function deleteBondInfo(state) {
    const devices = state.getIn(['selectedAdapter', 'connectedDevices']);

    return devices.reduce(
        (prevState, device) =>
            prevState.setIn(
                [
                    'selectedAdapter',
                    'connectedDevices',
                    device.instanceId,
                    'bonded',
                ],
                false
            ),
        state
    );
}

function serverSetupApplied(state) {
    return state.setIn(['selectedAdapter', 'isServerSetupApplied'], true);
}

function showConnectionParamsDialog(state, bool) {
    return state.set('showConnectionParams', bool);
}

function setConnectionParams(state, params) {
    persistentStore.setConnectionParams(params);
    return state.set('connectionParameters', params);
}

// eslint-disable-next-line func-names
export default function (oldState = getImmutableRoot(), action) {
    let state = oldState;
    const adapterSubReducers = combineReducers({
        deviceDetails,
        serverSetup,
        security,
    });

    if (state.selectedAdapter !== null) {
        const newSubReducerStates = adapterSubReducers(
            {
                deviceDetails: state.selectedAdapter.deviceDetails,
                serverSetup: state.selectedAdapter.serverSetup,
                security: state.selectedAdapter.security,
            },
            action
        );

        state = state.mergeIn(['selectedAdapter'], newSubReducerStates);
    }

    switch (action.type) {
        case AdapterAction.ADAPTER_OPEN:
            return openAdapter(state, action.adapter);
        case AdapterAction.ADAPTER_OPENED:
            return adapterOpened(state, action.adapter);
        case AdapterAction.ADAPTER_CLOSED:
            return closeAdapter(state);
        case AdapterAction.ADAPTER_ERROR:
            return adapterError(state, action.adapter, action.error);
        case AdapterAction.ADAPTER_STATE_CHANGED:
            return adapterStateChanged(state, action.adapter, action.state);
        case AdapterAction.ADAPTER_RESET_PERFORMED:
            return adapterResetPerformed(state, action.adapter);
        case AdapterAction.ADAPTER_SCAN_TIMEOUT:
            return adapterScanTimeout(state, action.adapter);
        case AdapterAction.ADAPTER_ADVERTISEMENT_TIMEOUT:
            return adapterAdvertisementTimeout(state, action.adapter);
        case AdapterAction.ERROR_OCCURED:
            return addError(state, action.error);
        case AdapterAction.DEVICE_CONNECT:
            return deviceConnect(state, action.device);
        case AdapterAction.DEVICE_CONNECTED:
            return deviceConnected(state, action.device);
        case AdapterAction.DEVICE_CONNECT_CANCELED:
            return deviceConnectCanceled(state);
        case AdapterAction.DEVICE_DISCONNECTED:
            return deviceDisconnected(state, action.device, action.reason);
        case AdapterAction.DEVICE_INITIATE_PAIRING:
            return deviceInitiatePairing(state, action.device);
        case AdapterAction.DEVICE_CONNECTION_PARAMS_UPDATED:
            return connectedDeviceUpdated(state, action.device);
        case AdapterAction.DEVICE_PHY_UPDATED:
            return connectedDevicePhyUpdated(state, action.device);
        case AdapterAction.DEVICE_DATA_LENGTH_UPDATED:
            return connectedDeviceDataLengthUpdated(state, action.device);
        case AdapterAction.DEVICE_MTU_UPDATED:
            return connectedDeviceMtuUpdated(state, action.device, action.mtu);
        case AdapterAction.DEVICE_SECURITY_CHANGED:
            return deviceSecurityChanged(
                state,
                action.device,
                action.parameters
            );
        case AdapterAction.DEVICE_TOGGLE_AUTO_CONN_UPDATE:
            return toggleAutoConnUpdate(state);
        case AdapterAction.DEVICE_ADD_BOND_INFO:
            return addBondInfo(state, action.device, action.parameters);
        case AdapterAction.DEVICE_DISABLE_EVENTS:
            return disableDeviceEvents(state, action.deviceAddress);
        case AdapterAction.DEVICE_ENABLE_EVENTS:
            return enableDeviceEvents(state, action.deviceAddress);
        case AdapterAction.SHOW_CONNECTION_PARAMS:
            return showConnectionParamsDialog(state, true);
        case AdapterAction.HIDE_DIALOG:
            return showConnectionParamsDialog(state, false);
        case AdapterAction.SET_CONNECTION_PARAMS:
            return setConnectionParams(state, action.params);
        case SecurityActions.SECURITY_DELETE_BOND_INFO:
            return deleteBondInfo(state);
        case DeviceDetailsActions.DISCOVERED_DEVICE_NAME:
            return discoveredDeviceName(state, action.device, action.value);
        case ServerSetupActions.APPLIED_SERVER:
            return serverSetupApplied(state);
        default:
            return state;
    }
}
