var request = require("request")

exports.handler = function (event, context) {
    try {

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};


function onSessionStarted(sessionStartedRequest, session) {

}


function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback)
}

function onIntent(intentRequest, session, callback) {
    var intent = intentRequest.intent
    var intentName = intentRequest.intent.name;

    if (intentName == "GetFoodItemIntent") {
        handleGetFoodItemResopnse(intent, session, callback)
    } else if (intentName == "CreateFoodItemIntent") {
        handleCreateFoodItemResponse(intent, session, callback)
    } else if (intentName == "AddFoodItemIntent") {
        handleAddFoodItemResponse(intent, session, callback)
    } else if (intentName == "ReomveFoodItemIntent") {
        handleRemoveFoodItemResponse(intent, session, callback)
    } else if (intentName == "AMAZON.HelpIntent") {
        handleGetHelpRequest(intent, session, callback)
    } else if (intentName == "AMAZON.StopIntent") {
        handleFinishSessionRequest(intent, session, callback)
    } else if (intentName == "AMAZON.CancelIntent") {
        handleFinishSessionRequest(intent, session, callback)
    } else {
        throw "Invalid intent"
    }
}


function onSessionEnded(sessionEndedRequest, session) {

}



function getWelcomeResponse(callback) {
    var speechOutput = "Welcome to you're home inventory. You can check your inventory by asking what items you have, you can add or remove items and even create new item-slots."
    + " For example... say something like add 6 apples to my inventory. Or how many apples are in my inventory?"

    var reprompt = "What would you like to do? You can check your inventory by asking what items you have, you can add or remove items and even create new item slots in your inventory."

    var header = "Home Invnetory!"

    var shouldEndSession = false

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))

}



function handleGetFoodItemResopnse(intent, session, callback) {
    getJSON(function(itemData) {
      var itemName = intent.slots.ItemName.value
      var speechOutput = itemName
      var repromptText = ''
      var shouldEndSession = false
      if (itemData != "ERORR") {
      itemData.forEach(function(item) {
        if(item.food === itemName) {
          console.log(item.food)
          speechOutput = `You have ${item.quantity} ${item.food}`
        }
      })
      }
      callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
    })
}

function getJSON(callback){
  request.get(url(), function(error, response, body){
    var itemData = JSON.parse(body);
    var result = itemData.foods


      callback(result);
  })
}

function url() {
  return "https://immense-woodland-18375.herokuapp.com/foods"
}

function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    var speechOutput = "You can check your inventory by asking what items you have. You can add or remove items and even create new item-slots."
    + " For example... say something like add 6 apples to my inventory. Or how many apples are in my inventory?" + " If you would like to add a new item-slot, say something like, create oranges in inventory or add new Oranges slot to my inventory"

    var repromptText = speechOutput

    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession))

}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye! Thank you for using Home Inventory!", "", true));
}


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}
