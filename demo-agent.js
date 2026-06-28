#!/usr/bin/env node

/**
 * Minimal Gemini API Agentic Programming Demo
 * 
 * This script demonstrates a simple agent that can use tools/functions
 * to accomplish tasks autonomously.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define tools the agent can use
const tools = [
  {
    name: 'calculate',
    description: 'Performs basic arithmetic calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")'
        }
      },
      required: ['expression']
    }
  },
  {
    name: 'get_current_time',
    description: 'Gets the current date and time',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];

// Tool implementations
function executeTool(toolName, args) {
  switch (toolName) {
    case 'calculate':
      try {
        // Simple eval for demo - in production use a safe math parser
        const result = eval(args.expression);
        return { result: result.toString() };
      } catch (error) {
        return { error: 'Invalid expression' };
      }
    
    case 'get_current_time':
      return { time: new Date().toISOString() };
    
    default:
      return { error: 'Unknown tool' };
  }
}

async function runAgent(task) {
  console.log(`\n🤖 Agent Task: ${task}\n`);
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    tools: [{ functionDeclarations: tools }]
  });

  const chat = model.startChat();
  let response = await chat.sendMessage(task);
  
  let iterationCount = 0;
  const maxIterations = 5;

  // Agentic loop: keep going until the model stops requesting tools
  while (iterationCount < maxIterations) {
    iterationCount++;
    
    const functionCalls = response.response.functionCalls();
    
    if (!functionCalls || functionCalls.length === 0) {
      // No more tool calls - agent is done
      console.log('✅ Agent Response:', response.response.text());
      break;
    }

    // Execute each tool call
    const functionResponses = functionCalls.map(call => {
      console.log(`🔧 Tool Call: ${call.name}(${JSON.stringify(call.args)})`);
      const result = executeTool(call.name, call.args);
      console.log(`📊 Tool Result:`, result);
      
      return {
        name: call.name,
        response: result
      };
    });

    // Send tool results back to the model
    response = await chat.sendMessage(functionResponses);
  }

  if (iterationCount >= maxIterations) {
    console.log('⚠️  Max iterations reached');
  }
}

// Run the demo
const task = "What is the current time, and what is 42 multiplied by 17?";
runAgent(task).catch(console.error);
