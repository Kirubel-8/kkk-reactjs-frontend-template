const smpp = require("smpp");
const { parsePhoneNumberFromString } = require("libphonenumber-js");
const logger = require("./logger");
const { Sms } = require("../models");
const formatPhoneNumber = (phoneNumber) => {
  const parsedNumber = parsePhoneNumberFromString(phoneNumber, "ET");
  if (parsedNumber && parsedNumber.isValid()) {
    return parsedNumber.number.replace("+", "");
  }
  throw new Error("Invalid phone number format");
};

const sendSMS = async (
  phoneNumber,
  message,
  sender = process.env.SMPP_SOURCE_ADDR || "CFMS",
  createdBy = null
) => {
  logger.info(
    `Connecting to SMPP server at ${process.env.SMPP_HOST}:${process.env.SMPP_PORT}`
  );
  return new Promise((resolve, reject) => {
    const session = new smpp.Session({
      host: process.env.SMPP_HOST,
      port: parseInt(process.env.SMPP_PORT),
    });

    session.on("error", async (error) => {
      logger.error(`SMPP Session Error: ${error.message}`);
      try {
        await Sms.create({
          sender,
          recipient: phoneNumber,
          message,
          status: "failed",
          error: error.message,
          sent_at: new Date(),
          created_by: createdBy,
        });
      } catch (dbError) {
        logger.error(`Failed to save notification error: ${dbError.message}`);
      }
      reject(error);
    });

    session.bind_transceiver(
      {
        system_id: process.env.SMPP_SYSTEM_ID,
        password: process.env.SMPP_PASSWORD,
      },
      async (pdu) => {
        if (pdu.command_status !== 0) {
          const errMsg = "Failed to bind SMPP session.";
          logger.error(errMsg);
          try {
            await Sms.create({
              sender,
              recipient: phoneNumber,
              message,
              status: "failed",
              error: errMsg,
              sent_at: new Date(),
              created_by: createdBy,
            });
          } catch (dbError) {
            logger.error(`Failed to save SMS error: ${dbError.message}`);
          }
          return reject(new Error(errMsg));
        }

        let formattedNumber;

        try {
          formattedNumber = formatPhoneNumber(phoneNumber);
        } catch (formatError) {
          logger.error(`Phone formatting error: ${formatError.message}`);
          try {
            await Sms.create({
              sender,
              recipient: phoneNumber,
              message,
              status: "failed",
              error: formatError.message,
              sent_at: new Date(),
              created_by: createdBy,
            });
          } catch (dbError) {
            logger.error(`Failed to save SMS error: ${dbError.message}`);
          }
          return reject(formatError);
        }

        logger.info(
          `SMPP bound successfully. Sending SMS to ${formattedNumber}`
        );

        session.submit_sm(
          {
            destination_addr: formattedNumber,
            short_message: message,
            source_addr: process.env.SMPP_SOURCE_ADDR || "CFMS",
          },
          async (pdu) => {
            session.close();
            if (pdu.command_status === 0) {
              logger.info("SMPP Message sent successfully.");
              try {
                await Sms.create({
                  sender,
                  recipient: phoneNumber,
                  message,
                  status: "sent",
                  sent_at: new Date(),
                  created_by: createdBy,
                });
              } catch (dbError) {
                logger.error(`Failed to save SMS: ${dbError.message}`);
              }
              resolve();
            } else {
              const errMsg = `SMPP Error: ${pdu.command_status}`;
              logger.error(errMsg);

              try {
                await Sms.create({
                  sender,
                  recipient: phoneNumber,
                  message,
                  status: "failed",
                  error: errMsg,
                  sent_at: new Date(),
                  created_by: createdBy,
                });
              } catch (dbError) {
                logger.error(`Failed to save SMS error: ${dbError.message}`);
              }
              reject(new Error(errMsg));
            }
          }
        );
      }
    );
  });
};

module.exports = {
  sendSMS,
};
