package com.anonymous.smarttoymobile

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.io.InputStream
import java.io.OutputStream
import java.util.UUID

class PandaBluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private var bluetoothSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var inputStream: InputStream? = null

    override fun getName(): String = "PandaBluetooth"

    @ReactMethod
    fun isConnected(promise: Promise) {
        val connected = bluetoothSocket != null && bluetoothSocket!!.isConnected
        promise.resolve(connected)
    }

    @ReactMethod
    fun listPairedDevices(promise: Promise) {
        try {
            val adapter = BluetoothAdapter.getDefaultAdapter()
            if (adapter == null) {
                promise.reject("NO_BT", "El dispositivo no tiene Bluetooth")
                return
            }
            val paired = adapter.bondedDevices
            val array: WritableArray = Arguments.createArray()
            if (paired != null) {
                for (device in paired) {
                    val map: WritableMap = Arguments.createMap()
                    map.putString("name", device.name ?: "Desconocido")
                    map.putString("address", device.address)
                    array.pushMap(map)
                }
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun connect(targetNameOrAddress: String?, promise: Promise) {
        Thread {
            try {
                val adapter = BluetoothAdapter.getDefaultAdapter()
                if (adapter == null) {
                    promise.reject("NO_BT", "Bluetooth no disponible")
                    return@Thread
                }
                if (!adapter.isEnabled) {
                    promise.reject("BT_DISABLED", "Bluetooth está apagado")
                    return@Thread
                }

                disconnectInternal()

                val paired = adapter.bondedDevices
                var targetDevice: BluetoothDevice? = null

                val searchKey = if (targetNameOrAddress.isNullOrBlank()) "Panda_Fisico_BT" else targetNameOrAddress
                if (paired != null) {
                    for (d in paired) {
                        if (d.name?.equals(searchKey, ignoreCase = true) == true || d.address.equals(searchKey, ignoreCase = true)) {
                            targetDevice = d
                            break
                        }
                    }
                }

                if (targetDevice == null) {
                    promise.reject("NOT_FOUND", "No se encontró '$searchKey' en los dispositivos vinculados. Por favor vincúlalo primero en Ajustes de Bluetooth.")
                    return@Thread
                }

                adapter.cancelDiscovery()
                val socket = targetDevice.createRfcommSocketToServiceRecord(SPP_UUID)
                socket.connect()

                bluetoothSocket = socket
                outputStream = socket.outputStream
                inputStream = socket.inputStream

                promise.resolve(true)
            } catch (e: Exception) {
                disconnectInternal()
                promise.reject("CONNECT_FAIL", "Error al conectar por Bluetooth: ${e.message}")
            }
        }.start()
    }

    @ReactMethod
    fun sendHug(promise: Promise) {
        Thread {
            try {
                if (bluetoothSocket == null || !bluetoothSocket!!.isConnected || outputStream == null) {
                    promise.reject("NOT_CONNECTED", "Bluetooth no está conectado al Panda")
                    return@Thread
                }
                outputStream?.write("1\n".toByteArray(Charsets.UTF_8))
                outputStream?.flush()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("WRITE_FAIL", "Error enviando abrazo: ${e.message}")
            }
        }.start()
    }

    @ReactMethod
    fun sendCommand(cmd: String, promise: Promise) {
        Thread {
            try {
                if (bluetoothSocket == null || !bluetoothSocket!!.isConnected || outputStream == null) {
                    promise.reject("NOT_CONNECTED", "Bluetooth no está conectado al Panda")
                    return@Thread
                }
                val payload = if (cmd.endsWith("\n")) cmd else "$cmd\n"
                outputStream?.write(payload.toByteArray(Charsets.UTF_8))
                outputStream?.flush()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("WRITE_FAIL", "Error enviando comando: ${e.message}")
            }
        }.start()
    }

    @ReactMethod
    fun disconnect(promise: Promise) {
        disconnectInternal()
        promise.resolve(true)
    }

    private fun disconnectInternal() {
        try {
            outputStream?.close()
        } catch (_: Exception) {}
        try {
            inputStream?.close()
        } catch (_: Exception) {}
        try {
            bluetoothSocket?.close()
        } catch (_: Exception) {}
        bluetoothSocket = null
        outputStream = null
        inputStream = null
    }
}
