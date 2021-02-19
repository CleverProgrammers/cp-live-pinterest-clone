/**
 * The operating system (OS) on which the process represented by this resource is running.
 *
 * In case of virtualized environments, this is the operating system as it
 * is observed by the process, i.e., the virtualized guest rather than the
 * underlying host.
 * https://github.com/open-telemetry/opentelemetry-specification/blob/master/specification/resource/semantic_conventions/os.md
 */
export declare const OperatingSystem: {
    /**
     * The operating system type.
     * This should be set to one of {@link OperatingSystemValues}
     * E.g., "WINDOWS"
     *
     * @remarks
     * Required.
     */
    TYPE: string;
    /**
     * Human readable (not intended to be parsed) OS version information.
     * E.g., "Microsoft Windows [Version 10.0.18363.778]"
     *
     * @remarks
     * Required if applicable.
     */
    DESCRIPTION: string;
};
/**
 * {@link OperatingSystem.TYPE} SHOULD be set to one of the values
 * listed below.
 * If none of the listed values apply, a custom value best describing
 * the family the operating system belongs to CAN be used.
 */
export declare const OperatingSystemValues: {
    WINDOWS: string;
    LINUX: string;
    DARWIN: string;
    FREEBSD: string;
    NETBSD: string;
    OPENBSD: string;
    DRAGONFLYBSD: string;
    HPUX: string;
    AIX: string;
    SOLARIS: string;
    ZOS: string;
};
//# sourceMappingURL=os.d.ts.map