var request = require("request")
var foodsUrl = "https://immense-woodland-18375.herokuapp.com/foods"
var recipesUrl = "https://immense-woodland-18375.herokuapp.com/recipes"

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
  } else if (intentName == "ListIngredientsInRecipe") {
      handleListIngredientsInRecipeResponse(intent, session, callback)
  } else if (intentName == "SelectRecipe") {
      handleSelectRecipeResponse(intent, session, callback)
  } else if (intentName == "UnselectRecipe") {
      handleUnselectRecipeResponse(intent, session, callback)
  } else if (intentName == "ListSelectedRecipes") {
      handleListSelectedRecipesResponse(intent, session, callback)
  } else if (intentName == "UseRecipe") {
      handleUseRecipeResponse(intent, session, callback)
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
  getFoodJSON(function(data) {
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
  getFoodJSON(function(data){
    var itemName = intent.slots.Item.value
    var additionalQuantity = intent.slots.ItemQuantity.value
    var speechOutput = itemName
    var repromptText = "Is there anything else you'd like to add?"
    var shouldEndSession = false
    var itemsData = data.foods
    var putUrl = foodsUrl
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
  getFoodJSON(function(data){
    var itemName = intent.slots.Item.value
    var quantityToRemove = intent.slots.ItemQuantity.value
    var speechOutput = itemName
    var repromptText = "Is there anything else you'd like to remove?"
    var shouldEndSession = false
    var itemsData = data.foods
    var putUrl = foodsUrl
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
  getFoodJSON(function(data) {
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

function handleListIngredientsInRecipeResponse(intent, session, callback) {
  getRecipesJSON(function(data) {
    var recipeName = intent.slots.recipe_name.value
    var speechOutput = recipeName
    var repromptText = ''
    var shouldEndSession = false
    var recipesData = data.recipes
    var recipeUrl = recipesUrl
    if(recipesData) {
      recipesData.forEach(function(recipe) {
        if(recipeName === recipe.recipe){
          recipeUrl += "/" + recipe.id
        }
      })
      request.get(recipeUrl, function(error, response, body){
        var recipeData = JSON.parse(body)
        var recipeName = recipeData.recipe.name
        var ingredients = recipeData.recipe.ingredients
        var itemsArray = []
        ingredients.forEach(function(item){
          if(item.quantity !== null){
            itemsArray.push(`${item.quantity} ${item.ingredient}`)
          } else if(item.quantity === null) {
            itemsArray.push(`${item.ingredient}`)
          }
        })
        var sentance = toSentence(itemsArray)
        speechOutput = `To make ${recipeName}, You will need ${sentance}`

        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
      })
    } else {
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
      }
  })
}

function handleSelectRecipeResponse(intent, session, callback) {
  getRecipesJSON(function(data){
    var recipeName = intent.slots.recipe_name.value
    var speechOutput = recipeName
    var repromptText = ''
    var shouldEndSession = false
    var recipesData = data.recipes
    var recipeUrl = recipesUrl
    if(recipesData){
    recipesData.forEach(function(recipe) {
      if(recipeName === recipe.recipe){
        if(recipe.selected === false) {
          recipeUrl += "/" + recipe.id
        } else {
          speechOutput = `${recipeName} has already been selected`
          return callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
        }
      }
    })
    request({
      url: recipeUrl,
      method: 'PUT',
      headers: {
          Accept: 'application/json',
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          selected: true
      })
    }, function(error, res, body) {
        speechOutput = `${recipeName} is now selected`
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
      })
    } else {
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
      }
  })
}

function handleUnselectRecipeResponse(intent, session, callback) {
  getRecipesJSON(function(data){
    var recipeName = intent.slots.recipe_name.value
    var speechOutput = recipeName
    var repromptText = ''
    var shouldEndSession = false
    var recipesData = data.recipes
    var recipeUrl = recipesUrl
    if(recipesData){
    recipesData.forEach(function(recipe) {
      if(recipeName === recipe.recipe){
        if(recipe.selected === true) {
          recipeUrl += "/" + recipe.id
        } else {
          speechOutput = `${recipeName} is not selected`
          return callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
        }
      }
    })
    request({
      url: recipeUrl,
      method: 'PUT',
      headers: {
          Accept: 'application/json',
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          selected: false
      })
    }, function(error, res, body) {
        speechOutput = `${recipeName} is now unselected`
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
      })
    } else {
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
      }
  })
}

function handleListSelectedRecipesResponse(intent, session, callback) {
    getRecipesJSON(function(data){
      var speechOutput = 'No recipes are selected'
      var repromptText = ''
      var shouldEndSession = false
      var recipesData = data.recipes
      var recipeArray = []
      if(recipesData){
        recipesData.forEach(function(recipe){
          if(recipe.selected){
            recipeArray.push(`${recipe.recipe}`)
          }
        })
        speechOutput = toSentence(recipeArray)
      }
      callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
    })
}

function handleUseRecipeResponse(intent, session, callback) {
  getRecipesJSON(function(data){
    var recipeName = intent.slots.recipe_name.value
    var speechOutput = ''
    var repromptText = ''
    var shouldEndSession = false
    var recipesData = data.recipes
    var recipeUrl = recipesUrl
    if(recipesData){
      recipesData.forEach(function(recipe){
        if(recipeName === recipe.recipe){
          recipeUrl += "/" + recipe.id
        }
      })
      request.get(recipeUrl, function(error, response, body){
        var recipeData = JSON.parse(body)
        var ingredients = recipeData.recipe.ingredients
        var requests = ingredients.map(function(item) {
          var foodUrl = foodsUrl + '/' + item.food_id
          return new Promise(function(resolve, reject){
            request.get(foodUrl, function(error, response, body){
              if (error){
                reject(error)
              } else {
                resolve(JSON.parse(body))
              }
            })
          })
        })
        Promise.all(requests)
        .then(function(responses){
          var newQuantityArray = []
          speechOutput = `Sorry, you do not have the ingredients to make ${recipeName} in your inventory`
          responses.forEach(function(item, index) {
            if(item.data.quantity - ingredients[index].quantity < 0){
              callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
            } else{
              newQuantityArray.push(item.data.quantity - ingredients[index].quantity)
            }
          })
          var putRequests = ingredients.map(function(item, index) {
            foodUrl = foodsUrl + '/' + item.food_id
            var newQuantity = newQuantityArray[index]
            return new Promise(function(resolve, reject){
              request({
                url: foodUrl,
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    quantity: newQuantity
                })
              }, function(error, res, body) {
                if (error){
                  reject(error)
                } else {
                  resolve(JSON.parse(body))
                }
              })
            })
          })
          Promise.all(putRequests)
          .then(function(responses){
            request({
              url: recipeUrl,
              method: 'PUT',
              headers: {
                  Accept: 'application/json',
                  "Content-Type": "application/json"
              },
              body: JSON.stringify({
                  selected: false
              })
            }, function(error, res, body) {
              speechOutput = `making ${recipeName} removing ingredients from your inventory. Enjoy`
              callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
            })
          }).catch(function(error){
            console.log(error);
          })
        }).catch(function(error){
          console.log(error);
        })
      })
    }
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

function getFoodJSON(callback){
  request.get(foodsUrl, function(error, response, body){
    var itemsData = JSON.parse(body);
    var result = itemsData
      callback(result);
  })
}

function getRecipesJSON(callback){
  request.get(recipesUrl, function(error, response, body){
    var recipesData = JSON.parse(body)
    var result = recipesData
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
