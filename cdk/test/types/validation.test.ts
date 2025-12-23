import {
  validateCidr,
  validateEnvironmentConfig,
  EnvironmentConfig,
} from "../../lib/types";

describe("validateCidr", () => {
  describe("valid CIDR blocks", () => {
    it("should accept 10.0.0.0/8 range", () => {
      expect(validateCidr("10.0.0.0/16")).toBe(true);
      expect(validateCidr("10.1.0.0/16")).toBe(true);
      expect(validateCidr("10.255.255.255/8")).toBe(true);
    });

    it("should accept 172.16.0.0/12 range", () => {
      expect(validateCidr("172.16.0.0/16")).toBe(true);
      expect(validateCidr("172.20.0.0/16")).toBe(true);
      expect(validateCidr("172.31.255.255/12")).toBe(true);
    });

    it("should accept 192.168.0.0/16 range", () => {
      expect(validateCidr("192.168.0.0/24")).toBe(true);
      expect(validateCidr("192.168.1.0/24")).toBe(true);
      expect(validateCidr("192.168.255.255/16")).toBe(true);
    });
  });

  describe("invalid CIDR blocks", () => {
    it("should reject public IP ranges", () => {
      expect(validateCidr("8.8.8.8/32")).toBe(false);
      expect(validateCidr("1.1.1.1/24")).toBe(false);
      expect(validateCidr("203.0.113.0/24")).toBe(false);
    });

    it("should reject invalid format", () => {
      expect(validateCidr("not-a-cidr")).toBe(false);
      expect(validateCidr("10.0.0.0")).toBe(false);
      expect(validateCidr("10.0.0.0/")).toBe(false);
      expect(validateCidr("")).toBe(false);
    });

    it("should reject out-of-range private IPs", () => {
      expect(validateCidr("172.15.0.0/16")).toBe(false); // Below 172.16
      expect(validateCidr("172.32.0.0/16")).toBe(false); // Above 172.31
      expect(validateCidr("11.0.0.0/16")).toBe(false); // Not in 10.0.0.0/8
    });
  });
});

describe("validateEnvironmentConfig", () => {
  const validConfig: EnvironmentConfig = {
    name: "dev",
    vpcCidr: "10.0.0.0/16",
    maxAzs: 2,
    enableNatGateways: false,
    tags: {
      Application: "Comprehend",
      Environment: "dev",
      ManagedBy: "CDK",
    },
  };

  describe("valid configurations", () => {
    it("should accept valid dev configuration", () => {
      const errors = validateEnvironmentConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it("should accept valid staging configuration", () => {
      const config: EnvironmentConfig = {
        name: "staging",
        vpcCidr: "10.1.0.0/16",
        maxAzs: 2,
        enableNatGateways: true,
        natGateways: 2,
        tags: {
          Application: "Comprehend",
          Environment: "staging",
          ManagedBy: "CDK",
        },
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(0);
    });

    it("should accept valid prod configuration", () => {
      const config: EnvironmentConfig = {
        name: "prod",
        vpcCidr: "10.2.0.0/16",
        maxAzs: 3,
        enableNatGateways: true,
        natGateways: 3,
        tags: {
          Application: "Comprehend",
          Environment: "prod",
          ManagedBy: "CDK",
        },
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(0);
    });

    it("should accept configuration with optional fields", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        accountId: "123456789012",
        region: "us-east-1",
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(0);
    });
  });

  describe("invalid environment name", () => {
    it("should reject invalid environment names", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        name: "invalid" as any,
        tags: {
          Application: "Comprehend",
          Environment: "invalid", // Match the invalid name to avoid tag mismatch error
          ManagedBy: "CDK",
        },
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("name");
      expect(errors[0].message).toContain("Invalid environment name");
    });
  });

  describe("invalid VPC CIDR", () => {
    it("should reject invalid CIDR blocks", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        vpcCidr: "8.8.8.8/32",
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("vpcCidr");
      expect(errors[0].message).toContain("Invalid VPC CIDR");
    });

    it("should reject malformed CIDR", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        vpcCidr: "not-a-cidr",
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("vpcCidr");
    });
  });

  describe("invalid maxAzs", () => {
    it("should reject maxAzs < 2", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        maxAzs: 1,
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("maxAzs");
      expect(errors[0].message).toContain("must be between 2 and 3");
    });

    it("should reject maxAzs > 3", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        maxAzs: 4,
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("maxAzs");
      expect(errors[0].message).toContain("must be between 2 and 3");
    });
  });

  describe("invalid natGateways", () => {
    it("should reject natGateways > maxAzs", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        maxAzs: 2,
        natGateways: 3,
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe("natGateways");
      expect(errors[0].message).toContain("cannot exceed maxAzs");
    });
  });

  describe("missing required tags", () => {
    it("should reject missing Application tag", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        tags: {
          Environment: "dev",
          ManagedBy: "CDK",
        },
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.some(
          (e) => e.field === "tags" && e.message.includes("Application"),
        ),
      ).toBe(true);
    });

    it("should reject missing Environment tag", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        tags: {
          Application: "Comprehend",
          ManagedBy: "CDK",
        },
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.some(
          (e) => e.field === "tags" && e.message.includes("Environment"),
        ),
      ).toBe(true);
    });

    it("should reject missing ManagedBy tag", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        tags: {
          Application: "Comprehend",
          Environment: "dev",
        },
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(
        errors.some(
          (e) => e.field === "tags" && e.message.includes("ManagedBy"),
        ),
      ).toBe(true);
    });
  });

  describe("mismatched Environment tag", () => {
    it("should reject Environment tag that does not match config name", () => {
      const config: EnvironmentConfig = {
        ...validConfig,
        name: "dev",
        tags: {
          Application: "Comprehend",
          Environment: "prod", // Mismatch!
          ManagedBy: "CDK",
        },
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "tags.Environment")).toBe(true);
    });
  });

  describe("multiple validation errors", () => {
    it("should return all validation errors", () => {
      const config: EnvironmentConfig = {
        name: "invalid" as any,
        vpcCidr: "not-a-cidr",
        maxAzs: 1,
        enableNatGateways: false,
        tags: {}, // Missing all required tags
      };
      const errors = validateEnvironmentConfig(config);
      expect(errors.length).toBeGreaterThanOrEqual(5); // name, vpcCidr, maxAzs, 3 tags
    });
  });
});
