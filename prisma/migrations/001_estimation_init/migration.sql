-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('Draft');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "EstimateStatus" NOT NULL DEFAULT 'Draft',
    "start_period" TEXT,
    "duration_months" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT NOT NULL,
    "total_effort_hours" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_cost_eur" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seniority" TEXT,

    CONSTRAINT "role_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_card_rates" (
    "id" TEXT NOT NULL,
    "role_type_id" TEXT NOT NULL,
    "rate_year" INTEGER NOT NULL,
    "hourly_rate_eur" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "price_card_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_role_selections" (
    "id" TEXT NOT NULL,
    "estimate_id" TEXT NOT NULL,
    "role_type_id" TEXT NOT NULL,

    CONSTRAINT "estimate_role_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solution_phases" (
    "id" TEXT NOT NULL,
    "estimate_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "total_effort_hours" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_cost_eur" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "solution_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "solution_phase_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "total_effort_hours" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_cost_eur" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "repetition_count" INTEGER NOT NULL DEFAULT 1,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "total_effort_hours" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "total_cost_eur" DECIMAL(18,2) NOT NULL DEFAULT 0,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_effort_entries" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "role_type_id" TEXT NOT NULL,
    "effort_hours" DECIMAL(18,4) NOT NULL,
    "hourly_rate_eur" DECIMAL(18,2) NOT NULL,
    "cost_eur" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "task_effort_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estimates_project_id_name_key" ON "estimates"("project_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "price_card_rates_role_type_id_rate_year_key" ON "price_card_rates"("role_type_id", "rate_year");

-- CreateIndex
CREATE UNIQUE INDEX "estimate_role_selections_estimate_id_role_type_id_key" ON "estimate_role_selections"("estimate_id", "role_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "solution_phases_estimate_id_name_key" ON "solution_phases"("estimate_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "modules_solution_phase_id_name_key" ON "modules"("solution_phase_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "task_effort_entries_task_id_role_type_id_key" ON "task_effort_entries"("task_id", "role_type_id");

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_card_rates" ADD CONSTRAINT "price_card_rates_role_type_id_fkey" FOREIGN KEY ("role_type_id") REFERENCES "role_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_role_selections" ADD CONSTRAINT "estimate_role_selections_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_role_selections" ADD CONSTRAINT "estimate_role_selections_role_type_id_fkey" FOREIGN KEY ("role_type_id") REFERENCES "role_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solution_phases" ADD CONSTRAINT "solution_phases_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_solution_phase_id_fkey" FOREIGN KEY ("solution_phase_id") REFERENCES "solution_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_effort_entries" ADD CONSTRAINT "task_effort_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_effort_entries" ADD CONSTRAINT "task_effort_entries_role_type_id_fkey" FOREIGN KEY ("role_type_id") REFERENCES "role_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
