var request = require("request")
var url = "https://immense-woodland-18375.herokuapp.com/foods"

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
  } else if (intentName == "RemoveFoodItemIntent") {
      handleRemoveFoodItemResponse(intent, session, callback)
  } else if (intentName == "GetFoodsByType") {
      handleGetFoodsByTypeResponse(intent, session, callback)
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
  var speechOutput = "Welcome to KIM, your kitchen inventory manager. You can check your inventory by asking what items you have, you can add or remove items and even create new item cards."
  + " For example... say something like add 6 apples to my inventory. Or how many apples are in my inventory?"
  var reprompt = "What would you like to do? You can check your inventory by asking what items you have, you can add or remove items and even create new item cards in your inventory."
  var header = "KIM!"
  var shouldEndSession = false
  var sessionAttributes = {
      "speechOutput" : speechOutput,
      "repromptText" : reprompt
  }
  callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))
}

function handleGetFoodItemResopnse(intent, session, callback) {
  getJSON(function(data) {
    var itemName = intent.slots.Item.value
    var speechOutput = itemName
    var repromptText = ''
    var shouldEndSession = false
    var itemsData = data.foods
    if (itemsData != "ERORR") {
      itemsData.forEach(function(item) {
        if(item.food === itemName) {
          speechOutput = `You have ${item.quantity} ${item.food}`
        }
      })
    }
    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
  })
}

function handleAddFoodItemResponse(intent, session, callback) {
  var newQuantity = 0
  getJSON(function(data){
    var itemName = intent.slots.Item.value
    var additionalQuantity = intent.slots.ItemQuantity.value
    var speechOutput = itemName
    var repromptText = "Is there anything else you'd like to add?"
    var shouldEndSession = false
    var itemsData = data.foods
    var putUrl = url
  if (itemsData) {
    itemsData.forEach(function(item) {
      if(item.food === itemName) {
      putUrl += "/" + item.id
       newQuantity = parseInt(item.quantity) + parseInt(additionalQuantity)
      }
    })
    request({
      url: putUrl,
      method: 'PUT',
      headers: {
          Accept: 'application/json',
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          quantity: newQuantity
      })
    }, function(error, res, body) {
        speechOutput = `Inventory updated, you now have ${newQuantity} ${itemName}`
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
      }
    );
  } else {
      callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
    }
  })
}

function handleRemoveFoodItemResponse(intent, session, callback) {
  var newQuantity = 0
  getJSON(function(data){
    var itemName = intent.slots.Item.value
    var quantityToRemove = intent.slots.ItemQuantity.value
    var speechOutput = itemName
    var repromptText = "Is there anything else you'd like to remove?"
    var shouldEndSession = false
    var itemsData = data.foods
    var putUrl = url
  if (itemsData) {
    itemsData.forEach(function(item) {
      if(item.food === itemName) {
        putUrl += "/" + item.id
        if((parseInt(item.quantity) - parseInt(quantityToRemove)) >= 0) {
         newQuantity = parseInt(item.quantity) - parseInt(quantityToRemove)
       } else {
         newQuantity = 0
         speechOutput = `You only have ${item.quanitiy} ${itemName}. Removed ${item.quanitiy} ${itemName} from your inventory`
       }
      }
    })
    request({
      url: putUrl,
      method: 'PUT',
      headers: {
          Accept: 'application/json',
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          quantity: newQuantity
      })
    }, function(error, res, body) {
        speechOutput = `Inventory updated, you now have ${newQuantity} ${itemName}`
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
      }
    );
  } else {
      callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
    }
  })
}

function handleGetFoodsByTypeResponse(intent, session, callback) {
  getJSON(function(data) {
    var itemType = intent.slots.food_type.value
    var speechOutput = itemType
    var repromptText = ''
    var shouldEndSession = false
    var itemsData = data.foods
    var itemsList = 'You have '
    var itemsArray = []
    if (itemsData) {
      itemsData.forEach(function(item) {
        if(item.food_type === itemType) {
          if(itemType !== 'spices' && itemType !== 'miscellaneous') {
            itemsArray.push(`${item.quantity} ${item.food}`)
          } else {
            itemsArray.push(`${item.food}`)
          }
        }
      })
      speechOutput = itemsList + toSentence(itemsArray)
    }
    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
  })
}

function toSentence(array) {
  if (array.length === 0) {
    return ''
  }
  var string = '';
  var last = array.splice(-2)
  var lastString = last[0] + ' and ' + last[1]
  for (var i = 0; i < array.length; i++) {
    string += array[i] + ", "
  }
return string + lastString
}

function getJSON(callback){
  request.get(url, function(error, response, body){
    var itemsData = JSON.parse(body);
    var result = itemsData
      callback(result);
  })
}


function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    var speechOutput = "You can check your inventory by asking what items you have. You can add or remove items and even create new item cards."
    + " For example... say something like add 6 apples to my inventory. Or how many apples are in my inventory?" + " If you would like to add a new item card, say something like, create oranges in inventory or add new Oranges card to my inventory"

    var repromptText = speechOutput

    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession))

}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye! Thank you for using KIM, your kitchen inventory manager!", "", true));
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
