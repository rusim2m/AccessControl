import json
import os
import sys
import time
import requests
from smartcard.System import readers
from smartcard.util import toHexString
from smartcard.CardRequest import CardRequest
from smartcard.CardType import AnyCardType
from smartcard.Exceptions import CardRequestTimeoutException, CardConnectionException, NoCardException

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

if not os.path.exists(CONFIG_PATH):
    print(f"ERROR: Configuration file not found at {CONFIG_PATH}")
    print("Ask the dealer to configure the reader.")
    sys.exit(1)

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config = json.load(f)

BACKEND_URL = config["backendUrl"]
READER_ID = config["readerId"]
SERIAL_NUMBER = config.get("serialNumber", "")
API_KEY = config["apiKey"]
POLL_TIMEOUT = 1

GET_UID = [0xFF, 0xCA, 0x00, 0x00, 0x00]
BEEP_GREEN = [0xFF, 0x00, 0x40, 0x0E, 0x04, 0x01, 0x01, 0x01, 0x01]
BEEP_RED   = [0xFF, 0x00, 0x40, 0xD0, 0x04, 0x05, 0x05, 0x03, 0x02]


def findPiccReader():
    for r in readers():
        if "PICC" in str(r):
            return r
    return None


def sendScan(uid):
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/card-reader/scan",
            headers={"X-Reader-Key": API_KEY},
            json={"cardUID": uid, "readerId": READER_ID},
            timeout=5,
        )
        if response.status_code == 401:
            print(f"  [Auth error] {response.json().get('message', 'unauthorized')}")
            return None
        return response.json()
    except Exception as e:
        print(f"  [API error] {e}")
        return None


def signalFeedback(connection, granted):
    try:
        cmd = BEEP_GREEN if granted else BEEP_RED
        connection.transmit(cmd)
    except Exception:
        pass


def processIsListning():
    picc = findPiccReader()
    if not picc:
        print("ERROR: Contactless interface not found.")
        return

    print(f"Bridge started.")
    print(f"  Reader: {picc}")
    print(f"  Backend: {BACKEND_URL}")
    print(f"  Reader ID: {READER_ID}")
    if SERIAL_NUMBER:
        print(f"  Serial: {SERIAL_NUMBER}")
    print(f"\nWaiting for card taps... \n")

    cardtype = AnyCardType()
    last_uid = None
    last_time = 0

    while True:
        try:
            cardrequest = CardRequest(timeout=POLL_TIMEOUT, readers=[picc], cardType=cardtype)
            cardservice = cardrequest.waitforcard()
            cardservice.connection.connect()

            data, status1, status2 = cardservice.connection.transmit(GET_UID)
            if status1 != 0x90 or status2 != 0x00:
                continue

            uid = toHexString(data).replace(" ", "")
            now = time.time()
            if uid == last_uid and (now - last_time) < 2:
                continue
            last_uid = uid
            last_time = now

            print(f"[{time.strftime('%H:%M:%S')}] Card tapped: {uid}")

            result = sendScan(uid)
            if result:
                decision = result.get("decision", "Unknown")
                reason = result.get("reason", "")
                granted = decision.lower() == "granted"
                marker = "GRANTED" if granted else "DENIED"
                print(f"  {marker} - {reason}\n")
                signalFeedback(cardservice.connection, granted)
            else:
                print(f"  Could not reach backend\n")
                signalFeedback(cardservice.connection, False)

            try:
                cardservice.connection.disconnect()
            except Exception:
                pass

            time.sleep(0.5)

        except CardRequestTimeoutException:
            continue
        except (CardConnectionException, NoCardException):
            time.sleep(0.3)
            continue
        except KeyboardInterrupt:
            print("\nBridge stopped.")
            break
        except Exception as e:
            print(f"  [Error] {e}")
            time.sleep(0.5)


processIsListning()
