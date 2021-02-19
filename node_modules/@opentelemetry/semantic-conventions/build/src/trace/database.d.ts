/**
 * Database attribute names defined by the Opetelemetry Semantic Conventions specification
 * https://github.com/open-telemetry/opentelemetry-specification/blob/master/specification/trace/semantic_conventions/database.md
 */
export declare const DatabaseAttribute: {
    /**
     * An identifier for the database management system (DBMS) product being used.
     *
     * @remarks
     * Required.
     */
    DB_SYSTEM: string;
    /**
     * The connection string used to connect to the database.
     * It is recommended to remove embedded credentials.
     *
     * @remarks
     * Optional.
     */
    DB_CONNECTION_STRING: string;
    /**
     * Username for accessing the database, e.g., "readonly_user" or "reporting_user".
     *
     * @remarks
     * Optional.
     */
    DB_USER: string;
    /**
     * If no [tech-specific attribute](https://github.com/open-telemetry/opentelemetry-specification/blob/master/specification/trace/semantic_conventions/database.md#call-level-attributes-for-specific-technologies)
     * is defined in the list below,
     * this attribute is used to report the name of the database being accessed.
     * For commands that switch the database,this should be set to the
     * target database (even if the command fails).
     *
     * @remarks
     * Required if applicable and no more specific attribute is defined.
     */
    DB_NAME: string;
    /**
     * The database statement being executed.
     * Note that the value may be sanitized to exclude sensitive information.
     * E.g., for db.system="other_sql", "SELECT * FROM wuser_table";
     * for db.system="redis", "SET mykey 'WuValue'".
     *
     * @remarks
     * Required if applicable.
     */
    DB_STATEMENT: string;
    /**
     * The name of the operation being executed,
     * e.g. the MongoDB command name such as findAndModify.
     * While it would semantically make sense to set this,
     * e.g., to an SQL keyword like SELECT or INSERT,
     * it is not recommended to attempt any client-side parsing of
     * db.statement just to get this property (the back end can do that if required).
     *
     * @remarks
     * Required if db.statement is not applicable.
     */
    DB_OPERATION: string;
    /**
     * The instance name connecting to.
     * This name is used to determine the port of a named instance.
     *
     * @remarks
     * If setting a `db.mssql.instance_name`,
     * `net.peer.port` is no longer required (but still recommended if non-standard)
     */
    DB_MSSSQL_INSTANCE_NAME: string;
    /**
     * The fully-qualified class name of the Java Database Connectivity (JDBC) driver used to connect,
     * e.g., "org.postgresql.Driver" or "com.microsoft.sqlserver.jdbc.SQLServerDriver".
     *
     * @remarks
     * Optional.
     */
    DB_JDBC_DRIVER_CLASSNAME: string;
    /**
     * The name of the keyspace being accessed. To be used instead of the generic db.name attribute.
     *
     * @remarks
     * Required.
     */
    DB_CASSANDRA_KEYSPACE: string;
    /**
     * The [HBase namespace](https://hbase.apache.org/book.html#_namespace) being accessed.
     * To be used instead of the generic db.name attribute.
     *
     * @remarks
     * Required.
     */
    DB_HBASE_NAMESPACE: string;
    /**
     * The index of the database being accessed as used in the [SELECT command](https://redis.io/commands/select),
     * provided as an integer. To be used instead of the generic db.name attribute.
     *
     * @remarks
     * Required if other than the default database (0).
     */
    DB_REDIS_DATABASE_INDEX: string;
    /**
     * The collection being accessed within the database stated in db.name.
     *
     * @remarks
     * Required.
     */
    DB_MONGODB_COLLECTION: string;
    /** Deprecated. Not in spec. */
    DB_TYPE: string;
    /** Deprecated. Not in spec. */
    DB_INSTANCE: string;
    /** Deprecated. Not in spec. */
    DB_URL: string;
};
//# sourceMappingURL=database.d.ts.map