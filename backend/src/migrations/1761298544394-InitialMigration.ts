import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1761298544394 implements MigrationInterface {
    name = 'InitialMigration1761298544394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "customer" ("id" int NOT NULL IDENTITY(1,1), "firstName" nvarchar(50) NOT NULL, "lastName" nvarchar(50) NOT NULL, "email" nvarchar(100) NOT NULL, "phone" nvarchar(15), "address" nvarchar(255), CONSTRAINT "UQ_fdb2f3ad8115da4c7718109a6eb" UNIQUE ("email"), CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment" ("id" int NOT NULL IDENTITY(1,1), "paymentDate" date NOT NULL, "amount" decimal(10,2) NOT NULL, "paymentMethod" nvarchar(50) NOT NULL, "rentalId" int, CONSTRAINT "PK_fcaec7df5adf9cac408c686b2ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "rental" ("id" int NOT NULL IDENTITY(1,1), "startDate" datetime NOT NULL, "endDate" datetime NOT NULL, "totalCost" decimal(10,2) NOT NULL, "status" nvarchar(255) NOT NULL CONSTRAINT "DF_9a7f1619ce053ec7999c651f4a5" DEFAULT 'active', "carId" int, "customerId" int, CONSTRAINT "PK_a20fc571eb61d5a30d8c16d51e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "insurance" ("id" int NOT NULL IDENTITY(1,1), "provider" nvarchar(255) NOT NULL, "policyNumber" nvarchar(255) NOT NULL, "coverageType" nvarchar(255) NOT NULL, "expiryDate" datetime NOT NULL, "premium" decimal(10,2) NOT NULL, "carId" int, CONSTRAINT "PK_07152a21fd75ea211dcea53e3c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "REL_6dd4ee3a8aee6ce2eabe7a56c3" ON "insurance" ("carId") WHERE "carId" IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "maintenance" ("id" int NOT NULL IDENTITY(1,1), "maintenanceType" nvarchar(255) NOT NULL, "description" nvarchar(255) NOT NULL, "maintenanceDate" datetime NOT NULL, "cost" decimal(10,2) NOT NULL, "status" nvarchar(255) NOT NULL CONSTRAINT "DF_e41685ea89f76aa9cd38cbd18b7" DEFAULT 'scheduled', "carId" int, CONSTRAINT "PK_542fb6a28537140d2df95faa52a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "car" ("id" int NOT NULL IDENTITY(1,1), "model" nvarchar(100) NOT NULL, "make" nvarchar(50) NOT NULL, "year" int NOT NULL, "color" nvarchar(30), "rentalRate" decimal(10,2) NOT NULL, "isAvailable" bit NOT NULL CONSTRAINT "DF_4fe99c34ae7f5c6086016781e16" DEFAULT 1, CONSTRAINT "PK_55bbdeb14e0b1d7ab417d11ee6d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reservation" ("id" int NOT NULL IDENTITY(1,1), "startDate" datetime NOT NULL, "endDate" datetime NOT NULL, "status" nvarchar(255) NOT NULL CONSTRAINT "DF_29be1e5ad1e641d6966b30aa9b9" DEFAULT 'pending', "totalPrice" decimal(10,2) NOT NULL, "carId" int, "customerId" int, CONSTRAINT "PK_48b1f9922368359ab88e8bfa525" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "location" ("LocationID" int NOT NULL IDENTITY(1,1), "LocationName" nvarchar(100) NOT NULL, "Address" nvarchar(255) NOT NULL, "ContactNumber" nvarchar(15), CONSTRAINT "PK_17a578e4e8ef13bdd8fba4d684b" PRIMARY KEY ("LocationID"))`);
        await queryRunner.query(`ALTER TABLE "payment" ADD CONSTRAINT "FK_91237e89951409b1a51e3cde810" FOREIGN KEY ("rentalId") REFERENCES "rental"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rental" ADD CONSTRAINT "FK_7ac6d039d8d83c9b38cd51cefbf" FOREIGN KEY ("carId") REFERENCES "car"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rental" ADD CONSTRAINT "FK_def55ab51eed32ed8267ac956bb" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insurance" ADD CONSTRAINT "FK_6dd4ee3a8aee6ce2eabe7a56c35" FOREIGN KEY ("carId") REFERENCES "car"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "maintenance" ADD CONSTRAINT "FK_6c511176ffbc21a7698e0cc72c4" FOREIGN KEY ("carId") REFERENCES "car"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_2d51eea28bf301076d640182058" FOREIGN KEY ("carId") REFERENCES "car"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reservation" ADD CONSTRAINT "FK_7dce8a5a6907476eba30fedde91" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_7dce8a5a6907476eba30fedde91"`);
        await queryRunner.query(`ALTER TABLE "reservation" DROP CONSTRAINT "FK_2d51eea28bf301076d640182058"`);
        await queryRunner.query(`ALTER TABLE "maintenance" DROP CONSTRAINT "FK_6c511176ffbc21a7698e0cc72c4"`);
        await queryRunner.query(`ALTER TABLE "insurance" DROP CONSTRAINT "FK_6dd4ee3a8aee6ce2eabe7a56c35"`);
        await queryRunner.query(`ALTER TABLE "rental" DROP CONSTRAINT "FK_def55ab51eed32ed8267ac956bb"`);
        await queryRunner.query(`ALTER TABLE "rental" DROP CONSTRAINT "FK_7ac6d039d8d83c9b38cd51cefbf"`);
        await queryRunner.query(`ALTER TABLE "payment" DROP CONSTRAINT "FK_91237e89951409b1a51e3cde810"`);
        await queryRunner.query(`DROP TABLE "location"`);
        await queryRunner.query(`DROP TABLE "reservation"`);
        await queryRunner.query(`DROP TABLE "car"`);
        await queryRunner.query(`DROP TABLE "maintenance"`);
        await queryRunner.query(`DROP INDEX "REL_6dd4ee3a8aee6ce2eabe7a56c3" ON "insurance"`);
        await queryRunner.query(`DROP TABLE "insurance"`);
        await queryRunner.query(`DROP TABLE "rental"`);
        await queryRunner.query(`DROP TABLE "payment"`);
        await queryRunner.query(`DROP TABLE "customer"`);
    }

}
