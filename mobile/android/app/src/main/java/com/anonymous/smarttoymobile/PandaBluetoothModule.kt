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
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.InputStream
import java.io.OutputStream
import java.util.UUID

class PandaBluetoothModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
    private var bluetoothSocket: BluetoothSocket? = null
    private var outputStream: OutputStream? = null
    private var inputStream: InputStream? = null
    private var readerThread: Thread? = null

    private fun sendEvent(eventName: String, params: Any?) {
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (_: Exception) {}
    }

    override fun getName(): String = "PandaBluetooth"

    override fun getConstants(): MutableMap<String, Any> {
        val constants = HashMap<String, Any>()
        constants["appFlavor"] = BuildConfig.APP_FLAVOR
        constants["applicationId"] = reactApplicationContext.packageName
        return constants
    }

    @ReactMethod
    fun getAppFlavor(promise: Promise) {
        promise.resolve(BuildConfig.APP_FLAVOR)
    }

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

                startReaderThread()

                promise.resolve(true)
            } catch (e: Exception) {
                disconnectInternal()
                promise.reject("CONNECT_FAIL", "Error al conectar por Bluetooth: ${e.message}")
            }
        }.start()
    }

    private fun startReaderThread() {
        readerThread?.interrupt()
        readerThread = Thread {
            val buffer = ByteArray(1024)
            val stringBuilder = StringBuilder()
            sendEvent("onPandaConnectionChanged", true)
            while (!Thread.currentThread().isInterrupted && bluetoothSocket?.isConnected == true) {
                try {
                    val bytes = inputStream?.read(buffer) ?: -1
                    if (bytes > 0) {
                        val chunk = String(buffer, 0, bytes, Charsets.UTF_8)
                        stringBuilder.append(chunk)
                        while (stringBuilder.contains("\n")) {
                            val lineEnd = stringBuilder.indexOf("\n")
                            val line = stringBuilder.substring(0, lineEnd).trim()
                            stringBuilder.delete(0, lineEnd + 1)
                            if (line.isNotEmpty()) {
                                sendEvent("onPandaDataReceived", line)
                            }
                        }
                    } else if (bytes == -1) {
                        break
                    }
                } catch (_: Exception) {
                    break
                }
            }
            sendEvent("onPandaConnectionChanged", false)
        }.apply {
            isDaemon = true
            start()
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

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
            readerThread?.interrupt()
        } catch (_: Exception) {}
        readerThread = null

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
