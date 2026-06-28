#!/usr/bin/env node

/**
 * Minimal Anthropic Claude API Agentic Programming Demo
 * This script demonstrates a simple agent that can use tools/functions
 * to accomplish tasks autonomously.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import { TokenTracker } from './token-tracker.js';

dotenv.config({ path: '.env' });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define tools the agent can use
const tools = [
  {
    name: 'calculate',
    description: 'Performs basic arithmetic calculations',
    input_schema: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description:
            'Mathematical expression to evaluate (e.g., "2 + 2", "10 * 5")',
        },
      },
      required: ['expression'],
    },
  },
  {
    name: 'get_current_time',
    description: 'Gets the current date and time',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
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

  const messages = [{ role: 'user', content: task }];
  let iterationCount = 0;
  const maxIterations = 5;
  const tokenTracker = new TokenTracker();

  // Agentic loop: keep going until the model stops requesting tools
  while (iterationCount < maxIterations) {
    iterationCount++;

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      tools,
      messages,
    });

    // Track token usage
    tokenTracker.track(response);

    console.log(`\nStop reason: ${response.stop_reason}`);

    if (response.stop_reason === 'end_turn') {
      // Agent is done
      const textContent = response.content.find(
        (block) => block.type === 'text',
      );
      if (textContent) {
        console.log('✅ Agent Response:', textContent.text);
      }
      break;
    }

    if (response.stop_reason === 'tool_use') {
      // Execute tool calls
      messages.push({ role: 'assistant', content: response.content });

      const toolResults = response.content
        .filter((block) => block.type === 'tool_use')
        .map((toolUse) => {
          console.log(
            `🔧 Tool Call: ${toolUse.name}(${JSON.stringify(toolUse.input)})`,
          );
          const result = executeTool(toolUse.name, toolUse.input);
          console.log(`📊 Tool Result:`, result);

          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          };
        });

      messages.push({ role: 'user', content: toolResults });
    } else {
      break;
    }
  }

  if (iterationCount >= maxIterations) {
    console.log('⚠️  Max iterations reached');
  }

  // Display total token usage
  tokenTracker.displayTotal();
}

// Run the demo
const task = 'What is the current time, and what is 42 multiplied by 17?';
runAgent(task).catch(console.error);
