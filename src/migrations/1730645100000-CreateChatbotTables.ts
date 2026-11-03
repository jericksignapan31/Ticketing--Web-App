import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChatbotTables1730645100000 implements MigrationInterface {
    name = 'CreateChatbotTables1730645100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create chatbot_knowledge table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chatbot_knowledge" (
                "knowledge_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "category" varchar NOT NULL,
                "question" text NOT NULL,
                "answer" text NOT NULL,
                "keywords" text,
                "relevant_ticket_ids" text,
                "confidence_score" numeric(3,2) NOT NULL DEFAULT '0.5',
                "usage_count" integer NOT NULL DEFAULT '0',
                "helpful_count" integer NOT NULL DEFAULT '0',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created chatbot_knowledge table');

        // Create chatbot_interaction table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chatbot_interaction" (
                "interaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "user_id" uuid NOT NULL,
                "conversation_id" uuid NOT NULL,
                "user_message" text NOT NULL,
                "chatbot_response" text NOT NULL,
                "response_type" varchar NOT NULL DEFAULT 'GENERAL',
                "detected_intent" varchar,
                "intent_confidence" numeric(3,2),
                "knowledge_id" uuid,
                "ticket_id" uuid,
                "satisfaction_score" integer,
                "is_helpful" boolean,
                "user_feedback" text,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_chatbot_interaction_user" FOREIGN KEY ("user_id") REFERENCES "user_account"("user_id") ON DELETE SET NULL,
                CONSTRAINT "fk_chatbot_interaction_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("conversation_id") ON DELETE CASCADE
            )
        `);
        console.log('✅ Created chatbot_interaction table');

        // Create ticket_solution table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ticket_solution" (
                "solution_id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "ticket_id" uuid NOT NULL,
                "issue_type" varchar,
                "category" varchar,
                "solution_summary" text NOT NULL,
                "resolution_steps" text,
                "resolution_notes" text,
                "resolution_time_minutes" integer,
                "tags" text,
                "prevent_tips" text,
                "is_active" boolean NOT NULL DEFAULT true,
                "usage_count" integer NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created ticket_solution table');

        // Create indexes for better query performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chatbot_knowledge_category" ON "chatbot_knowledge"("category")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chatbot_knowledge_confidence" ON "chatbot_knowledge"("confidence_score")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chatbot_interaction_user" ON "chatbot_interaction"("user_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_chatbot_interaction_conversation" ON "chatbot_interaction"("conversation_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_ticket_solution_ticket" ON "ticket_solution"("ticket_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_ticket_solution_category" ON "ticket_solution"("category")`);
        console.log('✅ Created indexes');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_ticket_solution_category"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_ticket_solution_ticket"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_chatbot_interaction_conversation"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_chatbot_interaction_user"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_chatbot_knowledge_confidence"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_chatbot_knowledge_category"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "ticket_solution"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "chatbot_interaction"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "chatbot_knowledge"`);
    }
}
